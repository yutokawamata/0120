/**
 * 状態管理のための共通関数を提供するモジュール
 */

/**
 * 初期状態のオブジェクト
 */
export const initialState = {
  navigation: {
    mode: "initial",
    selectedOption: "initial",
    selectedLevel: "initial",
    selectNext: false,
  },
  kanji: {
    selectedKanji: {
      A: [], B: [], C: [], D: [], E: [], F: []
    },
    currentKanjiIndex: 0,
    kanjiList: [],
    isTraining: "initial",
  },
  repetition: {
    remainingRepetitions: 0,
    repetitionCount: "initial",
    remainingConfirmation: 0,
    confirmationCount: "initial",
  }
};

/**
 * 状態遷移の定義
 */
export const StateTransitions = {
  // おぼえよう！モードに戻る
  RETURN_TO_MEMORIZE: (updateFunctions, state) => {
    const { updateNavigation, updateKanji, updateRepetition } = updateFunctions;
    updateNavigation({ 
      selectedOption: "remember",
      selectNext: true
    });
    updateKanji({ isTraining: "initial" });
    updateRepetition({
      repetitionCount: state.repetitionCount,
      remainingRepetitions: state.repetitionCount,
      confirmationCount: state.confirmationCount,
      remainingConfirmation: state.confirmationCount
    });
  },

  // 最初の画面に戻る
  RETURN_TO_START: (updateFunctions) => {
    const { updateNavigation, updateKanji, updateRepetition } = updateFunctions;
    updateNavigation({
      mode: "initial",
      selectedOption: "initial",
      selectedLevel: "initial",
      selectNext: false
    });
    updateRepetition({
      repetitionCount: "initial",
      remainingRepetitions: 0,
      confirmationCount: "initial",
      remainingConfirmation: 0
    });
    updateKanji({
      selectedKanji: {},
      kanjiList: [],
      currentKanjiIndex: 0,
      isTraining: "initial"
    });
  },

     // 学習方法選択画面に戻る
     RETURN_TO_METHOD_SELECTION: (updateFunctions) => {
      const { updateNavigation, updateKanji, updateRepetition } = updateFunctions;
      updateNavigation({
        selectedOption: "initial",
        selectedLevel: "initial",
        selectNext: false
      });
      updateRepetition({
        repetitionCount: "initial",
        remainingRepetitions: 0,
        confirmationCount: "initial",
        remainingConfirmation: 0
      });
      updateKanji({
        selectedKanji: {},
        kanjiList: [],
        currentKanjiIndex: 0,
        isTraining: "initial"
      });
    },

  // たしかめよう！モードに移行
  TRANSITION_TO_CONFIRM: (updateFunctions, state) => {
    const { updateNavigation, updateKanji, updateRepetition } = updateFunctions;
    updateKanji({ isTraining: "training", currentKanjiIndex: 0 });
    updateNavigation({ selectedOption: "read" });
    if (state && state.confirmationCount && state.repetitionCount) {
      // 反復回数 × たしかめよう回数 を設定
      const totalConfirmations = parseInt(state.repetitionCount) * parseInt(state.confirmationCount);
      updateRepetition({
        remainingConfirmation: totalConfirmations
      });
    }
  },

  // 学習を開始
  START_TRAINING: (updateFunctions, state) => {
    const { updateKanji, updateRepetition } = updateFunctions;
    updateKanji({ isTraining: "training",currentKanjiIndex: 0});
    // 反復回数を設定
    if (state && state.repetitionCount) {
      updateRepetition({
        remainingRepetitions: parseInt(state.repetitionCount)
      });
    } else {
      console.warn('反復回数が設定されていません');
    }
  },

  // レベル選択に戻る
  RETURN_TO_LEVEL_SELECTION: (updateFunctions) => {
    const { updateNavigation } = updateFunctions;
    updateNavigation({ selectedLevel: "initial" });
  },

  // 漢字選択をクリア
  CLEAR_KANJI_SELECTION: (updateFunctions, level) => {
    const { updateKanji } = updateFunctions;
    updateKanji({
      selectedKanji: {
        [level]: []
      }
    });
  },

  // 次のステップへ進む
  PROCEED_TO_NEXT: (updateFunctions) => {
    const { updateNavigation } = updateFunctions;
    updateNavigation({ selectNext: true });
  },

  // 反復回数を設定
  SET_REPETITION_COUNT: (updateFunctions, count) => {
    const { updateRepetition } = updateFunctions;
    updateRepetition({
      repetitionCount: count.toString(),
      remainingRepetitions: count
    });
  },

  // 確認回数を設定
  SET_CONFIRMATION_COUNT: (updateFunctions, count) => {
    const { updateRepetition } = updateFunctions;
    updateRepetition({
      confirmationCount: count.toString(),
      remainingConfirmation: count
    });
  },

  // 学習を完了
  COMPLETE_TRAINING: (updateFunctions) => {
    const { updateKanji } = updateFunctions;
    updateKanji({ isTraining: "complete" });
  },

  // 集団モードのよめるかな？完了時の状態リセット
  RESET_GROUP_MODE_STATE: (updateFunctions) => {
    const { updateNavigation, updateKanji, updateRepetition } = updateFunctions;
    updateNavigation({
        selectedOption: "initial",
        selectedLevel: "initial",
        selectNext: false
    });
    updateKanji({
        currentKanjiIndex: 0,
        kanjiList: [],
        isTraining: "initial"
    });
    updateRepetition({
        remainingRepetitions: 0,
        repetitionCount: "initial",
        remainingConfirmation: 0,
        confirmationCount: "initial"
    });
  },

  // 反復回数選択画面に戻る
  RETURN_TO_REPETITION_SELECTION: (updateFunctions) => {
    const { updateRepetition } = updateFunctions;
    // 反復回数選択画面に戻るために、repetitionCountを一時的にリセットして
    // すぐに元の値に戻す処理を行う
    updateRepetition({
      confirmationCount: "initial",
      remainingConfirmation: 0,
      repetitionCount: "initial",
      remainingRepetitions: 0
    });
  }
};

/**
 * 状態チェックのための関数群
 */
export const StateCheckers = {
  // 初期画面かどうか
  isInitialScreen: (state) => {
    return state.mode === "initial";
  },

  // 学習方法選択画面かどうか
  isLearningMethodSelection: (state) => {
    return state.mode !== "initial" && state.selectedOption === "initial";
  },

  // レベル選択画面かどうか
  isLevelSelection: (state) => {
    return state.selectedOption !== "initial" && state.selectedLevel === "initial";
  },

  // 漢字選択画面かどうか
  isKanjiSelection: (state) => {
    return !state.selectNext && 
           state.selectedLevel !== "initial" && 
           state.repetitionCount === "initial";
  },

  // 反復回数選択画面かどうか
  isRepetitionSelection: (state) => {
    return state.selectNext && state.repetitionCount === "initial";
  },

  // たしかめよう回数選択画面かどうか
  isConfirmationSelection: (state) => {
    return state.selectedOption === "remember" && 
           state.selectNext && 
           state.repetitionCount !== "initial" && 
           state.confirmationCount === "initial";
  },

  // よめるかな？のスタート画面かどうか
  isReadingStartScreen: (state) => {
    return state.isTraining === "initial" && 
           state.selectedOption === "read" && 
           state.selectNext && 
           state.repetitionCount !== "initial";
  },

  // おぼえよう！のスタート画面かどうか
  isMemorizeStartScreen: (state) => {
    return state.isTraining === "initial" && 
           state.selectedOption === "remember" && 
           state.selectNext && 
           state.confirmationCount !== "initial";
  },

  // おぼえよう！の学習終了画面かどうか
  isMemorizeComplete: (state) => {
    return state.isTraining === "complete" && 
           state.selectedOption === "remember" && 
           state.repetitionCount !== "initial" && 
           state.confirmationCount !== "initial";
  },

  // たしかめよう！の学習終了画面かどうか
  isConfirmComplete: (state) => {
    return state.isTraining === "complete" && 
           state.selectedOption === "read" && 
           state.repetitionCount !== "initial" && 
           state.confirmationCount !== "initial";
  },

  // 学習中かどうか
  isTraining: (state) => {
    return state.isTraining === "training";
  },

  // ナビゲーションバーを表示すべきかどうか
  shouldShowNavigation: (state) => {
    return state.isTraining !== "training" && state.isTraining !== "confirm";
  },

  // メインメニュー画面かどうか
  isMainMenuScreen: (state) => {
    return state.mode === "initial" || state.selectedOption === "initial";
  },

  // 終了画面かどうか
  isEndScreen: (state) => {
    // たしかめよう！完了時のみ終了画面を表示
    return state.isTraining === "complete" && 
           state.selectedOption === "read" && 
           state.confirmationCount !== "initial";
  },

  // 集団モードでよめるかな？完了時に学習方法選択に戻るかどうか
  shouldReturnToMethodSelection: (state) => {
    return state.isTraining === "complete" && 
           state.selectedOption === "read" && 
           state.mode === "group" &&
           state.confirmationCount === "initial";
  }
};

/**
 * 漢字関連の操作を行うヘルパー関数
 */
export const KanjiHelpers = {
  // 漢字が選択されているかチェック
  isKanjiSelected: (state, index) => {
    const level = state.selectedLevel;
    return state.selectedKanji[level]?.includes(index) || false;
  },

  // 選択された漢字の数を取得
  getSelectedKanjiCount: (state) => {
    const level = state.selectedLevel;
    return state.selectedKanji[level]?.length || 0;
  },

  // 現在の漢字を取得
  getCurrentKanji: (state) => {
    if (!state.kanjiList || !state.selectedKanji[state.selectedLevel]) return null;
    const selectedIndices = state.selectedKanji[state.selectedLevel];
    return state.kanjiList[selectedIndices[state.currentKanjiIndex]];
  }
}; 