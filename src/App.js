import React, { useState } from "react";
import { Menu } from "./components/Menu";
import { Navi } from "./components/Navi";
import { Img } from "./components/Img";
import { Title } from "./components/Title";
import { Training } from "./components/Training";
import { StateCheckers } from "./utils/stateManager";
import './App.css';

// CSVファイルを一括インポート
function importCSV(r) {
  const csvFiles = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '').split('.')[0];  // 拡張子を除去
    csvFiles[key] = r(item);
  });
  return csvFiles;
}

// 各学年のCSVファイルを一括インポート
const csvFiles = importCSV(require.context('./Kanji/CSV', false, /\.(csv)$/));

// 画像ファイルを一括インポート
function importIllust(r) {
  const images = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '');
    images[key] = r(item);
  });
  return images;
}

// 音声ァイルを一括インポート
function importSound(r) {
  const sounds = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '');
    sounds[key] = r(item);
  });
  return sounds;
}

// リソース管理オブジェクト
const resources = {
  // 漢字イラストを一括インポート
  illust: {
    A: importIllust(require.context('./Kanji/Illust/1stGrade', false, /\.(png|jpe?g|svg)$/)),
    B: importIllust(require.context('./Kanji/Illust/2ndGrade', false, /\.(png|jpe?g|svg)$/)),
    C: importIllust(require.context('./Kanji/Illust/3rdGrade', false, /\.(png|jpe?g|svg)$/)),
    D: importIllust(require.context('./Kanji/Illust/4thGrade', false, /\.(png|jpe?g|svg)$/)),
    E: importIllust(require.context('./Kanji/Illust/5thGrade', false, /\.(png|jpe?g|svg)$/)),
    F: importIllust(require.context('./Kanji/Illust/6thGrade', false, /\.(png|jpe?g|svg)$/))
  },
  // 漢字サウンドを一括インポート
  sound: {
    A: importSound(require.context('./Kanji/Sound/1stGrade', false, /\.(mp3)$/)),
    B: importSound(require.context('./Kanji/Sound/2ndGrade', false, /\.(mp3)$/)),
    C: importSound(require.context('./Kanji/Sound/3rdGrade', false, /\.(mp3)$/)),
    D: importSound(require.context('./Kanji/Sound/4thGrade', false, /\.(mp3)$/)),
    E: importSound(require.context('./Kanji/Sound/5thGrade', false, /\.(mp3)$/)),
    F: importSound(require.context('./Kanji/Sound/6thGrade', false, /\.(mp3)$/))
  },
  // 学年に応じたリソースを取得
  getIllustImages: (label) => resources.illust[label] || {},
  getSound: (label) => resources.sound[label] || {}
};

/**
 * アプリケーションのメインコンポーネント
 * 全体の状態管理と画面遷移を制御する
 */
export const App = () => {
  const [navigationState, setNavigationState] = useState({
    mode: "initial",
    selectedOption: "initial",
    selectedLevel: "initial",
    selectNext: false,
  });

  const [kanjiState, setKanjiState] = useState({
    selectedKanji: {
      A: [], B: [], C: [], D: [], E: [], F: []
    },
    currentKanjiIndex: 0,
    kanjiList: [],
    isTraining: "initial",
  });

  const [repetitionState, setRepetitionState] = useState({
    remainingRepetitions: 0,
    repetitionCount: "initial",
    remainingConfirmation: 0,
    confirmationCount: "initial",
  });

  const levels = [
    { label: "A", file: csvFiles['1Grade'] },
    { label: "B", file: csvFiles['2Grade'] },
    { label: "C", file: csvFiles['3Grade'] },
    { label: "D", file: csvFiles['4Grade'] },
    { label: "E", file: csvFiles['5Grade'] },
    { label: "F", file: csvFiles['6Grade'] }
  ];

  const handleLevelClick = async (label, file) => {
    try {
      const response = await fetch(file);
      const text = await response.text();
      const rows = text.split("\n")
        .filter(row => row.trim() !== '')
        .map((row) => row.split(",")); 

      const illustImages = resources.getIllustImages(label);
      const sound = resources.getSound(label);

      const newKanji = rows.map(([kanji, yomigana, illust, voice]) => {
        const fileName = illust.trim();
        const voiceFileName = voice ? voice.trim() : '';
        
        let voiceFile = null;
        if (voiceFileName && sound[voiceFileName]) {
          voiceFile = sound[voiceFileName];
          console.log(`音声ファイル読み込み成功: ${voiceFileName}`, voiceFile);
        } else {
          console.warn(`音声ファイルが見つかりません: ${voiceFileName}`);
        }

        return {
          kanji: kanji.trim(),
          yomigana: yomigana.trim(),
          illust: illustImages[fileName] || '',
          voice: voiceFile || null,
        };
      });

      updateKanjiState({ kanjiList: newKanji });
      updateNavigationState({ selectedLevel: label });
    } catch (error) {
      console.error("CSVの読み込みに失敗しました", error);
    }
  };

  const updateNavigationState = (updates) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  };

  const updateKanjiState = (updates) => {
    if (updates.selectedKanji && typeof updates.selectedKanji === 'object' && !Array.isArray(updates.selectedKanji)) {
      setKanjiState(prev => ({
        ...prev,
        ...updates,
        selectedKanji: {
          ...prev.selectedKanji,
          ...updates.selectedKanji
        }
      }));
    } else {
      setKanjiState(prev => ({ ...prev, ...updates }));
    }
  };

  const updateRepetitionState = (updates) => {
    setRepetitionState(prev => ({ ...prev, ...updates }));
  };

  const handleRemoveKanjiSelection = () => {
    const level = navigationState.selectedLevel;
    updateKanjiState({
      selectedKanji: {
        ...kanjiState.selectedKanji,
        [level]: []
      }
    });
  };

  // スタイル定義
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "50px",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    title: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "10px",
      marginTop: "50px",
      marginBottom: "60px",
    },
    navi: {
      position: "fixed",
      top: 0,
      width: "100%",
      backgroundColor: "white",
      zIndex: 1000,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },
    endScreen: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      padding: "20px",
      maxWidth: "1000px",
      margin: "0 auto",
      marginTop: "50px"
    },
    endScreenImage: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "500px",
      height: "auto"
    },
    endScreenButtons: {
      marginTop: "40px"
    },
    trainingContainer: {
      display: "flex",
      justifyContent: "center",
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      minHeight: "100vh",
    },
    groupTrainingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      maxWidth: "100vw",
      margin: "0 auto",
      padding: "0",
      minHeight: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#fff",
    }
  };

  const state = { ...navigationState, ...kanjiState, ...repetitionState };
  const updateFunctions = {
    updateNavigation: updateNavigationState,
    updateKanji: updateKanjiState,
    updateRepetition: updateRepetitionState,
    handleRemoveKanjiSelection
  };

  // 学習中の表示
  if (StateCheckers.isTraining(state)) {
    const containerStyle = state.mode === "individual" 
      ? styles.trainingContainer 
      : styles.groupTrainingContainer;

    return (
      <div style={containerStyle}>
        <Training 
          state={state}
          {...updateFunctions}
          levels={levels}
          handleLevelClick={handleLevelClick}
        />
      </div>
    );
  }

  // たしかめよう！終了画面の表示
  if (StateCheckers.isEndScreen(state)) {
    return (
      <div style={styles.endScreen}>
        <Title state={state} {...updateFunctions} />
        <div style={styles.endScreenImage}>
          <Img state={state} {...updateFunctions} />
        </div>
        <div style={styles.endScreenButtons}>
          <Menu 
            state={state}
            {...updateFunctions}
            levels={levels}
            handleLevelClick={handleLevelClick}
          />
        </div>
      </div>
    );
  }

  // 通常画面の表示
  return (
    <>
      <div style={styles.navi}>
        <Navi
          state={state}
          {...updateFunctions}
        />
      </div>
      <div style={styles.title}>
        <Title 
          state={state}
          {...updateFunctions}
        />
      </div>
      <div style={styles.container}>
        <Img
          state={state}
          {...updateFunctions}
        />
        <Menu 
          state={state}
          {...updateFunctions}
          levels={levels}
          handleLevelClick={handleLevelClick}
        />
      </div>
    </>
  );
};
