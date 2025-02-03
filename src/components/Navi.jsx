import React, { useState } from "react";

const naviContainerStyle = {
    height: "50px",
    backgroundColor: "#ddd",
    display: "flex",                // Flexboxを使用
    justifyContent: "space-between", // 両端に配置
    alignItems: "center",           // 垂直方向中央揃え
    padding: "0 20px",              // 左右の余白
};

const naviStyle = {
    padding: "10px 20px",
    backgroundColor: "#ddd",
    fontSize: "16px",
    color: "blue",
    border: "none",
    cursor: "pointer",
};

const naviLeftStyle = {
    ...naviStyle,                   // naviStyleの設定を継承
    marginRight: "auto",            // 左寄せ
};

const naviRightContainerStyle = {
    display: "flex",                // Flexboxを使用
    gap: "10px",                    // ボタン間の間隔
    marginLeft: "20px",             // 左側（戻るボタン）との間隔
};

const naviRightStyle = {
    ...naviStyle,                   // naviStyleの設定を継承
    padding: "10px 15px",           // 横幅を少し調整
};

/**
 * ナビゲーションコンポーネント
 * 画面遷移のためのナビゲーションボタンを提供する
 * @param {Object} props
 * @param {Object} props.state - アプリケーションの状態
 * @param {Function} props.updateNavigation - ナビゲーション状態を更新する関数
 * @param {Function} props.updateKanji - 漢字学習状態を更新する関数
 * @param {Function} props.updateRepetition - 反復学習状態を更新する関数
 * @param {Function} props.handleRemoveKanjiSelection - 漢字選択をクリアする関数
 */
export const Navi = ({ 
    state,
    updateNavigation,
    updateKanji,
    updateRepetition,
    handleRemoveKanjiSelection
}) => {
    return (
        <div style={naviContainerStyle}>
            {/* 初期画面では何も表示しない */}
            {state.mode === "initial" && (
                <div></div>
            )}

            {/* 練習方法選択画面のモード選択へ戻るボタン */}
            {state.mode !== "initial" && state.selectedOption === "initial" && state.selectedLevel === "initial" && (
                <>
                    <div></div>
                    <div style={naviRightContainerStyle}>
                        <button 
                            style={naviRightStyle} 
                            onClick={() => updateNavigation({ mode: "initial" })}
                        >
                            モード選択へ戻る
                        </button>
                    </div>
                </>
            )}

            {/* レベル選択画面のTOPへボタン */}
            {state.mode !== "initial" && state.selectedOption !== "initial" && state.selectedLevel === "initial" && (
                <>
                    <div></div>
                    <div style={naviRightContainerStyle}>
                        <button 
                            style={naviRightStyle} 
                            onClick={() => updateNavigation({ selectedOption: "initial" })}
                        >
                            TOPへ
                        </button>
                    </div>
                </>
            )}

            {/* 漢字選択画面の各種ボタン */}
            {!state.selectNext && state.selectedOption !== "initial" && state.selectedLevel !== "initial" && (
                <>
                    <button 
                        style={naviLeftStyle} 
                        onClick={() => updateNavigation({ selectedLevel: "initial" })}
                    >
                        ＜戻る
                    </button>
                    <div style={naviRightContainerStyle}>
                        <button 
                            style={naviRightStyle} 
                            onClick={handleRemoveKanjiSelection}
                        >
                            選択解除
                        </button>
                        <button 
                            style={naviRightStyle}
                            onClick={() => {
                                const level = state.selectedLevel;
                                const selectedCount = state.selectedKanji[level]?.length || 0;
                                if (selectedCount > 0) {
                                    updateNavigation({ selectNext: true });
                                }
                            }}
                        >
                            次へ
                        </button>
                        <button 
                            style={naviRightStyle} 
                            onClick={() => {
                                updateNavigation({
                                    selectedOption: "initial",
                                    selectedLevel: "initial",
                                    selectNext: false
                                });
                            }}
                        >
                            TOPへ
                        </button>
                    </div>
                </>
            )}

            {/* 反復回数選択画面の戻るボタン */}
            {state.repetitionCount === "initial" && state.selectNext && (
                <>
                    <button 
                        style={naviLeftStyle} 
                        onClick={() => {
                            updateNavigation({ selectNext: false });
                        }}
                    >
                        ＜戻る
                    </button>
                </>
            )}

            {/* 確かめよう回数選択画面の戻るボタン */}
            {state.selectedOption === "remember" && state.repetitionCount !== "initial" && state.selectNext && state.confirmationCount === "initial" && (
                <>
                    <button 
                        style={naviLeftStyle} 
                        onClick={() => {
                            updateNavigation({ selectNext: false });
                        }}
                    >
                        ＜戻る
                    </button>
                </>
            )}

            {/* おぼえよう！の学習終了後の戻るボタン */}
            {state.selectedOption === "remember" && state.isTraining === "complete" && (
                <>
                <div style={naviRightContainerStyle}>
                    <button 
                        style={naviRightStyle} 
                        onClick={() => {
                            updateNavigation({
                                //mode: "initial",
                                selectedOption: "initial",
                                selectedLevel: "initial",
                                selectNext: false,
                            });
                            updateKanji({
                                currentKanjiIndex: 0,
                                kanjiList: [],
                                isTraining: "initial",
                            });
                            updateRepetition({
                                remainingRepetitions: 0,
                                repetitionCount: "initial",
                                remainingConfirmation: 0,
                                confirmationCount: "initial",
                            });
                        }}
                    >
                        TOPへ
                    </button>
                </div>
                </>
            )}
        </div>
    );
};
  