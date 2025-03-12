import React from 'react';
import menuImage from '../Images/Menu1.png';
import endImage from '../Images/end.png';
import { StateCheckers } from '../utils/stateManager';

const imgStyle = {
  width: "500px",                 // 画像の幅
  borderRadius: "8px",            // 画像の角を丸く
};

const labelStyle = {
  width: "150px",                 // ラベルの幅
};

const containerStyle = {
  display: "flex",                // Flexboxを使用して横並び
  justifyContent: "space-between", // 画像とボタンを左右に分ける
  alignItems: "center",           // 縦方向に中央揃え
  width: "100%",                  // 親コンテナを100%幅に
};

// 終了画面用の中央配置スタイル
const endContainerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  marginTop: "20px",
};

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
        <div style={containerStyle}>
          <img
            src={menuImage}
            alt="メニュー画像"
            style={imgStyle}
          />
        </div>
      )}

      {/* たしかめよう！の学習終了後の画像 */}
      {StateCheckers.isEndScreen(state) && (
        <div style={endContainerStyle}>
          <img
            src={endImage}
            alt="終了画像"
            style={imgStyle}
          />
        </div>
      )}

      {/* 漢字選択画面の場合、レベル表示 */}
      {StateCheckers.isKanjiSelection(state) && (
        <div style={labelStyle}>
          <h1>レベル{state.selectedLevel}</h1>
        </div>
      )}
    </>
  );
};
