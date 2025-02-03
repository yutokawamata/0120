import React, { useState } from "react";
import { Menu } from "./components/Menu";
import { Navi } from "./components/Navi";
import { Img } from "./components/Img";
import { Title } from "./components/Title";
import { Training } from "./components/Training";
// 各学年の漢字データをCSVファイルからインポート
import grade1 from './Kanji/CSV/1Grade.csv';
import grade2 from './Kanji/CSV/2Grade.csv';
import grade3 from './Kanji/CSV/3Grade.csv';
import grade4 from './Kanji/CSV/4Grade.csv';
import grade5 from './Kanji/CSV/5Grade.csv';
import grade6 from './Kanji/CSV/6Grade.csv';
import './App.css';

// 画像ファイルを一括インポート
function importAll(r) {
  const images = {};
  r.keys().forEach((item) => {
    // ファイル名をそのままキーとして使用（./を除去）
    const key = item.replace('./', '');
    images[key] = r(item);
  });
  return images;
}

// 漢字イラストを一括インポート（1年生から3年生まで）
const illustImages1 = importAll(require.context('./Kanji/Illust/1stGrade', false, /\.(png|jpe?g|svg)$/));
const illustImages2 = importAll(require.context('./Kanji/Illust/2ndGrade', false, /\.(png|jpe?g|svg)$/));
const illustImages3 = importAll(require.context('./Kanji/Illust/3rdGrade', false, /\.(png|jpe?g|svg)$/));

// 学年に応じたイラスト画像を取得する関数
const getIllustImages = (label) => {
  switch (label) {
    case 'A':
      return illustImages1;  // 1年生の画像
    case 'B':
      return illustImages2;  // 2年生の画像
    case 'C':
      return illustImages3;  // 3年生の画像
    case 'D':
    case 'E':
    case 'F':
      return {};  // 4-6年生は画像なし
    default:
      return {};
  }
};

/**
 * アプリケーションのメインコンポーネント
 * 全体の状態管理と画面遷移を制御する
 */
export const App = () => {
  /**
   * ナビゲーション関連の状態を管理
   * @property {string} mode - アプリケーションの動作モード ("initial", "group", "individual")
   * @property {string} selectedOption - 選択された学習オプション ("initial", "read", "remember")
   * @property {string} selectedLevel - 選択された学年レベル ("initial", "A"～"F")
   * @property {boolean} selectNext - 次のステップに進むかどうかのフラグ
   */
  const [navigationState, setNavigationState] = useState({
    mode: "initial",
    selectedOption: "initial",
    selectedLevel: "initial",
    selectNext: false,
  });

  /**
   * 漢字学習に関連する状態を管理
   * @property {Object} selectedKanji - レベルごとの選択された漢字のインデックス配列
   * @property {number} currentKanjiIndex - 現在表示中の漢字のインデックス
   * @property {Array} kanjiList - CSVから読み込んだ漢字データのリスト
   * @property {string} isTraining - 学習状態 ("initial": 初期状態, "training": 学習中, "complete": 学習完了, "confirm": 確認モード)
   */
  const [kanjiState, setKanjiState] = useState({
    selectedKanji: {
      A: [],
      B: [],
      C: [],
      D: [],
      E: [],
      F: []
    },
    currentKanjiIndex: 0,
    kanjiList: [],
    isTraining: "initial",
  });

  /**
   * 反復学習に関連する状態を管理
   * @property {number} remainingRepetitions - 残りの反復回数
   * @property {string} repetitionCount - 設定された反復回数 ("initial", "1", "2", "3")
   * @property {number} remainingConfirmation - 確認モードでの残り回数
   * @property {string} confirmationCount - 設定された確認回数 ("initial", "1", "2", "3")
   */
  const [repetitionState, setRepetitionState] = useState({
    remainingRepetitions: 0,
    repetitionCount: "initial",
    remainingConfirmation: 0,
    confirmationCount: "initial",
  });

  /**
   * 各レベルとそれに対応するCSVファイルの定義
   * @type {Array<{label: string, file: string}>}
   */
  const levels = [
    { label: "A", file: grade1 },
    { label: "B", file: grade2 },
    { label: "C", file: grade3 },
    { label: "D", file: grade4 },
    { label: "E", file: grade5 },
    { label: "F", file: grade6 },
  ];

  /**
   * CSVファイルから漢字データを読み込む関数
   * @param {string} label - 選択されたレベルのラベル
   * @param {string} file - CSVファイルのパス
   */
  const handleLevelClick = async (label, file) => {
    try {
      const response = await fetch(file);
      const text = await response.text();
      const rows = text.split("\n")
        .filter(row => row.trim() !== '')
        .map((row) => row.split(",")); 

      // 学年に応じたイラスト画像を取得
      const illustImages = getIllustImages(label);

      // 各行のデータを構造化オブジェクトに変換
      const newKanji = rows.map(([kanji, yomigana, illust, voice]) => {
        const fileName = illust.trim();
        return {
          kanji: kanji.trim(),
          yomigana: yomigana.trim(),
          illust: illustImages[fileName] || '',  // イラストがない場合は空文字を設定
          voice: voice ? voice.trim() : '',
        };
      });

      // 状態を更新
      updateKanjiState({ kanjiList: newKanji });
      updateNavigationState({ selectedLevel: label });
    } catch (error) {
      console.error("CSVの読み込みに失敗しました", error);
    }
  };

  /**
   * ナビゲーション状態を更新するヘルパー関数
   * @param {Object} updates - 更新する状態のオブジェクト
   */
  const updateNavigationState = (updates) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  };

  /**
   * 漢字学習状態を更新するヘルパー関数
   * @param {Object} updates - 更新する状態のオブジェクト
   */
  const updateKanjiState = (updates) => {
    // selectedKanjiが更新される場合、オブジェクト構造を維持
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

  /**
   * 反復学習状態を更新するヘルパー関数
   * @param {Object} updates - 更新する状態のオブジェクト
   */
  const updateRepetitionState = (updates) => {
    setRepetitionState(prev => ({ ...prev, ...updates }));
  };

  /**
   * 選択された漢字をクリアする関数
   */
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
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "50px",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  };

  const titleStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "10px",
    marginTop: "50px",
    marginBottom: "60px",
  };

  const naviStyle = {
    position: "fixed",
    top: 0,
    width: "100%",
    backgroundColor: "white",
    zIndex: 1000,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  };
  
  return (
    <>
      {/* ナビゲーションバー */}
      <div style={naviStyle}>
        <Navi
          state={{ ...navigationState, ...kanjiState, ...repetitionState }}
          updateNavigation={updateNavigationState}
          updateKanji={updateKanjiState}
          updateRepetition={updateRepetitionState}
          handleRemoveKanjiSelection={handleRemoveKanjiSelection}
        />
      </div>
      {/* タイトル部分 */}
      <div style={titleStyle}>
        <Title 
          state={{ ...navigationState, ...kanjiState, ...repetitionState }}
          updateNavigation={updateNavigationState}
          updateKanji={updateKanjiState}
          updateRepetition={updateRepetitionState}
        />
      </div>
      {/* メインコンテンツ */}
      <div style={containerStyle}>
        {kanjiState.isTraining === "training" || kanjiState.isTraining === "confirm" ? (
          // 学習モード時の表示
          <Training 
            state={{ ...navigationState, ...kanjiState, ...repetitionState }}
            updateNavigation={updateNavigationState}
            updateKanji={updateKanjiState}
            updateRepetition={updateRepetitionState}
            levels={levels}
            handleLevelClick={handleLevelClick}
          />
        ) : (
          // メニュー選択時の表示
          <>
            <Img
              state={{ ...navigationState, ...kanjiState }}
              updateNavigation={updateNavigationState}
              updateKanji={updateKanjiState}
            />
            <Menu 
              state={{ ...navigationState, ...kanjiState, ...repetitionState }}
              updateNavigation={updateNavigationState}
              updateKanji={updateKanjiState}
              updateRepetition={updateRepetitionState}
              levels={levels}
              handleLevelClick={handleLevelClick}
            />
          </>
        )}
      </div>
    </>
  );
};
