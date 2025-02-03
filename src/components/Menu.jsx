import React, { useState } from 'react';
import grade1 from '../Kanji/CSV/1Grade.csv';
import grade2 from '../Kanji/CSV/2Grade.csv';
import grade3 from '../Kanji/CSV/3Grade.csv';
import grade4 from '../Kanji/CSV/4Grade.csv';
import grade5 from '../Kanji/CSV/5Grade.csv';
import grade6 from '../Kanji/CSV/6Grade.csv';

const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",  
    alignItems: "center",  // 中央揃え
    gap: "10px",
  };
  
const buttonGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 2列レイアウト
    gap: "10px",
};

const buttonStyle = {
    width: "300px",
    height: "50px",
    fontSize: "20px",
    backgroundColor: "gray",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "7px 7px 7px 7px",    // 上下の余白を追加
};

const repetitionButtonStyle = {
    ...buttonStyle,
    width: "200px",      // ボタンの幅を調整
    margin: "7px 7px 7px 7px",    // 上下の余白を追加
};

const tableContainerStyle = {
    maxHeight: "calc(100vh - 300px)", // ビューポートの高さから余白を引いた値
    overflowY: "auto",                // 縦方向のスクロールを有効化
    position: "relative",              // 子要素の位置指定の基準点
    width: "100%",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "center",
    position: "relative"              // 位置指定を相対的に
};

const headerStyle = {
    backgroundColor: "#ddd",
    padding: "8px",
    position: "sticky",               // ヘッダーを固定
    top: 0,                          // 上部に固定
    zIndex: 1,                       // 他の要素より前面に表示
    borderBottom: "1px solid #ccc"    // 下線のみ追加
};

const cellStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee"    // 下線のみ追加
};

const selectedCellStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee"    // 下線のみ追加
};

const checkCellStyle = {
    padding: "8px",
    width: "20px",                    // 固定幅を設定
    textAlign: "center",              // 中央揃え
    borderBottom: "1px solid #eee"    // 下線のみ追加
};

/**
 * メニューコンポーネント
 * モード選択、レベル選択、漢字選択、反復回数選択などの機能を提供
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 * @param {Function} props.updateNavigation - ナビゲーション状態を更新する関数
 * @param {Function} props.updateKanji - 漢字学習状態を更新する関数
 * @param {Function} props.updateRepetition - 反復学習状態を更新する関数
 * @param {Array} props.levels - 利用可能なレベルとそのCSVファイルの定義
 * @param {Function} props.handleLevelClick - レベル選択時の処理関数
 */
export const Menu = ({ 
    state,
    updateNavigation,
    updateKanji,
    updateRepetition,
    levels,
    handleLevelClick
}) => {
    /**
     * 漢字選択時の処理
     * @param {number} index - 選択された漢字のインデックス
     */
    const handleKanjiClick = (index) => {
        const level = state.selectedLevel;
        const currentSelected = state.selectedKanji[level] || [];
        
        if (currentSelected.includes(index)) {
            // 選択解除
            updateKanji({
                selectedKanji: {
                    ...state.selectedKanji,
                    [level]: currentSelected.filter(i => i !== index)
                }
            });
        } else {
            // 選択追加
            updateKanji({
                selectedKanji: {
                    ...state.selectedKanji,
                    [level]: [...currentSelected, index]
                }
            });
        }
    };

    // 漢字が選択されているかチェック
    const isKanjiSelected = (index) => {
        const level = state.selectedLevel;
        return state.selectedKanji[level]?.includes(index) || false;
    };

    return (
      <>
        {/* 初期モードのボタン */}
        {state.mode === "initial" && (
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={() => updateNavigation({ mode: "group" })}>
              集団モード
            </button>
            <button style={buttonStyle} onClick={() => updateNavigation({ mode: "individual" })}>
              個人モード
            </button>
          </div>
        )}
  
        {/* よめるかな？・おぼえよう！のボタン */}
        {state.mode !== "initial" && state.selectedOption === "initial" && (
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={() => updateNavigation({ selectedOption: "read" })}>
              よめるかな？
            </button>
            <button style={buttonStyle} onClick={() => updateNavigation({ selectedOption: "remember" })}>
              おぼえよう！
            </button>
          </div>
        )}
  
        {/* レベル選択のボタン */}
        {state.selectedOption !== "initial" && state.selectedLevel === "initial" && (
          <div style={buttonGridStyle}>
            {levels.map((level) => (
              <button
                key={level.label}
                style={buttonStyle}
                onClick={() => handleLevelClick(level.label, level.file)}
              >
                レベル{level.label}
              </button>
            ))}
          </div>
        )}

        {/* 漢字リストの表示 */}
        {!state.selectNext && state.selectedLevel !== "initial" && state.repetitionCount === "initial" && (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerStyle}>漢字</th>
                  <th style={headerStyle}>読み仮名</th>
                  <th style={headerStyle}></th>
                </tr>
              </thead>
              <tbody>
                {state.kanjiList.map((item, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      cursor: "pointer",
                      backgroundColor: isKanjiSelected(index) ? "#f0f0f0" : "white"
                    }}
                    onClick={() => handleKanjiClick(index)}
                  >
                    <td style={cellStyle}>{item.kanji}</td>
                    <td style={isKanjiSelected(index) ? selectedCellStyle : cellStyle}>
                      {item.yomigana}
                    </td>
                    <td style={checkCellStyle}>
                      {isKanjiSelected(index) && "✓"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 反復回数選択画面 */}
        {state.selectNext && state.repetitionCount === "initial" && (
          <div style={buttonContainerStyle}>
            {[1, 2, 3].map(count => (
              <button 
                key={count}
                style={repetitionButtonStyle} 
                onClick={() => {
                  updateRepetition({
                    repetitionCount: count.toString(),
                    remainingRepetitions: count
                  });
                }}
              >
                {count}回
              </button>
            ))}
          </div>
        )}

        {/* たしかめよう回数選択画面 */}
        {state.selectedOption === "remember" && state.selectNext && 
         state.repetitionCount !== "initial" && state.confirmationCount === "initial" && (
          <div style={buttonContainerStyle}>
            {[1, 2, 3].map(count => (
              <button 
                key={count}
                style={repetitionButtonStyle} 
                onClick={() => {
                  updateRepetition({
                    confirmationCount: count.toString(),
                    remainingConfirmation: count
                  });
                }}
              >
                {count}回
              </button>
            ))}
          </div>
        )}

        {/* よめるかな？のスタート画面 */}
        {state.selectedOption === "read" && state.selectNext && state.repetitionCount !== "initial" && (
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={() => updateKanji({ isTraining: "training" })}>
              スタート
            </button>
          </div>
        )}

        {/* おぼえよう！のスタート画面 */}
        {state.selectedOption === "remember" && state.selectNext && state.confirmationCount !== "initial" && state.isTraining === "initial" && (
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={() => updateKanji({ isTraining: "training" })}>
              スタート
            </button>
          </div>
        )}

        {/* おぼえよう！　の学習終了後のボタン */}
        {state.isTraining === "complete" && state.selectedOption === "remember" && 
         state.repetitionCount !== "initial" && state.confirmationCount !== "initial" && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button style={buttonStyle} onClick={() => updateKanji({ isTraining: "training" })}>
              もういちど
            </button>
            <button style={buttonStyle} onClick={() => updateKanji({ isTraining: "confirm" })}>
              たしかめよう
            </button>
          </div>
        )}
      </>
    );
};
  