import React from 'react';

// メニュー画像のインポート
import menuImage from '../Images/Menu1.png';

/**
 * スタイル定義
 */
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

/**
 * イメージコンポーネント
 * 画面状態に応じて適切な画像やラベルを表示する
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 */
export const Img = ({ state }) => {
  return (
    <>
      {(state.mode === "initial" || state.selectedOption === "initial") && (
        <div style={containerStyle}>
          <img
            src={menuImage}
            alt="メニュー画像"
            style={imgStyle}
          />
        </div>
      )}

      {/* 漢字選択画面の場合、レベル表示 */}
      {state.selectedOption !== "initial" && 
       state.selectedLevel !== "initial" && 
       !state.selectNext && (
        <div style={labelStyle}>
          <h2>レベル{state.selectedLevel}</h2>
        </div>
      )}
    </>
  );
};
