import React from 'react';
import menuImage from '../Images/Menu1.png';
import endImage from '../Images/end.png';
import { StateCheckers } from '../utils/stateManager';
import styles from '../styles/components/Img.module.css';

/**
 * イメージコンポーネント
 * 画面状態に応じて適切な画像やラベルを表示する
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 */
export const Img = ({ state }) => {
  return (
    <>
      {/* メニュー画面の画像 */}
      {StateCheckers.isMainMenuScreen(state) && (
        <div className={styles.container}>
          <img
            src={menuImage}
            alt="メニュー画像"
            className={styles.image}
          />
        </div>
      )}

      {/* たしかめよう！の学習終了後の画像 */}
      {StateCheckers.isEndScreen(state) && (
        <div className={styles.endContainer}>
          <img
            src={endImage}
            alt="終了画像"
            className={styles.image}
          />
        </div>
      )}

      {/* 漢字選択画面の場合、レベル表示 */}
      {StateCheckers.isKanjiSelection(state) && (
        <div className={styles.label}>
          <h1>レベル{state.selectedLevel}</h1>
        </div>
      )}
    </>
  );
};
