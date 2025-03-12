import React from 'react';
import { StateCheckers } from '../utils/stateManager';
import styles from '../styles/components/Title.module.css';

// タイトルの定義を一箇所にまとめる
const TITLES = {
  MAIN: "かんじチャレンジ",
  SELECT_KANJI: "漢字を選ぶ",
  SELECT_REPETITION: "反復回数選択",
  SELECT_CONFIRMATION: "たしかめよう回数選択",
  COMPLETE: "がんばったね！"
};

/**
 * 現在の状態に応じたタイトルを取得する
 * @param {Object} state - アプリケーションの状態
 * @returns {string|null} - 表示するタイトル
 */
const getTitleForState = (state) => {
  // たしかめよう！の学習終了後
  if (StateCheckers.isEndScreen(state)) {
    return TITLES.COMPLETE;
  }

  // 最初の画面はタイトルを表示
  if (StateCheckers.isMainMenuScreen(state)) {
    return TITLES.MAIN;
  }

  // 学習中は何も表示しない
  if (StateCheckers.isTraining(state)) {
    return null;
  }

  // 状態に応じたタイトルを返す
  if (StateCheckers.isLevelSelection(state)) {
    return TITLES.SELECT_KANJI;
  }

  //漢字一覧画面は何も表示しない
  if (StateCheckers.isKanjiSelection(state)) {
    return null;
  } 

  if (StateCheckers.isRepetitionSelection(state)) {
    return TITLES.SELECT_REPETITION;
  }

  if (StateCheckers.isConfirmationSelection(state)) {
    return TITLES.SELECT_CONFIRMATION;
  }

  return null;
};

/**
 * タイトルコンポーネント
 * 現在の画面状態に応じて適切なタイトルを表示する
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 */
export const Title = ({ state }) => {
  const title = getTitleForState(state);

  if (!title) {
    return null;
  }

  return (
    <div className={styles.title}>
      <h3>{title}</h3>
    </div>
  );
};
  