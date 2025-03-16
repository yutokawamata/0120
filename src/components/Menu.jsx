import React from 'react';
import { StateCheckers, StateTransitions } from '../utils/stateManager';
import { Button, ButtonContainer, ButtonGrid, ButtonColumn } from './Button.jsx';
import styles from '../styles/components/Menu.module.css';

/**
 * バージョン情報を表示するコンポーネント
 */
const VersionInfo = () => {
  // 最終更新日を表示
  //const today = new Date();
  const versionStr = "20250317-2";
  
  return (
    <div className={styles.versionInfo}>
      <p>Ver.{versionStr}</p>
    </div>
  );
};

/**
 * メニューコンポーネント
 * モード選択、レベル選択、漢字選択、反復回数選択などの機能を提供
 */
export const Menu = ({ 
    state,
    updateNavigation,
    updateKanji,
    updateRepetition,
    levels,
    handleLevelClick
}) => {
    const updateFunctions = {
        updateNavigation,
        updateKanji,
        updateRepetition
    };

    const handleKanjiClick = (index) => {
        const level = state.selectedLevel;
        const currentSelected = state.selectedKanji[level] || [];
        
        if (currentSelected.includes(index)) {
            updateKanji({
                selectedKanji: {
                    ...state.selectedKanji,
                    [level]: currentSelected.filter(i => i !== index)
                }
            });
        } else {
            updateKanji({
                selectedKanji: {
                    ...state.selectedKanji,
                    [level]: [...currentSelected, index]
                }
            });
        }
    };

    const isKanjiSelected = (index) => {
        const level = state.selectedLevel;
        return state.selectedKanji[level]?.includes(index) || false;
    };

    return (
      <>
        {/* 初期モードのボタン */}
        {StateCheckers.isInitialScreen(state) && (
          <>
            <ButtonContainer>
              <Button onClick={() => updateNavigation({ mode: "group" })}>
                集団モード
              </Button>
              <Button onClick={() => updateNavigation({ mode: "individual" })}>
                個人モード
              </Button>
            </ButtonContainer>
            <VersionInfo />
          </>
        )}
  
        {/* よめるかな？・おぼえよう！のボタン */}
        {StateCheckers.isLearningMethodSelection(state) && (
          <ButtonContainer>
            <Button onClick={() => updateNavigation({ selectedOption: "read" })}>
              よめるかな？
            </Button>
            <Button onClick={() => updateNavigation({ selectedOption: "remember" })}>
              おぼえよう！
            </Button>
          </ButtonContainer>
        )}
  
        {/* レベル選択のボタン */}
        {StateCheckers.isLevelSelection(state) && (
          <ButtonGrid>
            {/* 左列（ABC） */}
            <ButtonColumn>
              {levels.slice(0, 3).map((level) => (
                <Button
                  key={level.label}
                  onClick={() => handleLevelClick(level.label, level.file)}
                >
                  レベル{level.label}
                </Button>
              ))}
            </ButtonColumn>
            {/* 右列（DEF） */}
            <ButtonColumn>
              {levels.slice(3).map((level) => (
                <Button
                  key={level.label}
                  onClick={() => handleLevelClick(level.label, level.file)}
                >
                  レベル{level.label}
                </Button>
              ))}
            </ButtonColumn>
          </ButtonGrid>
        )}

        {/* 漢字リストの表示 */}
        {StateCheckers.isKanjiSelection(state) && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.header}>漢字</th>
                  <th className={styles.header}>よみがな</th>
                  <th className={styles.header}></th>
                </tr>
              </thead>
              <tbody>
                {state.kanjiList.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`${styles.row} ${isKanjiSelected(index) ? styles['row--selected'] : ''}`}
                    onClick={() => handleKanjiClick(index)}
                  >
                    <td className={styles.cell}>{item.kanji}</td>
                    <td className={styles.cell}>{item.yomigana}</td>
                    <td className={styles.checkCell}>
                      {isKanjiSelected(index) && "✓"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 反復回数選択画面 */}
        {StateCheckers.isRepetitionSelection(state) && (
          <ButtonContainer>
            {[1, 2, 3].map(count => (
              <Button 
                key={count}
                variant="small"
                onClick={() => {
                  updateRepetition({
                    repetitionCount: count.toString(),
                    remainingRepetitions: count
                  });
                }}
              >
                {count}回
              </Button>
            ))}
          </ButtonContainer>
        )}

        {/* たしかめよう回数選択画面 */}
        {StateCheckers.isConfirmationSelection(state) && (
          <ButtonContainer>
            {[1, 2, 3].map(count => (
              <Button 
                key={count}
                variant="small"
                onClick={() => {
                  updateRepetition({
                    confirmationCount: count.toString(),
                    remainingConfirmation: count
                  });
                }}
              >
                {count}回
              </Button>
            ))}
          </ButtonContainer>
        )}

        {/* よめるかな？のスタート画面 */}
        {StateCheckers.isReadingStartScreen(state) && (
          <div className={styles.startScreen}>
            <h1>かんじを<span>よんで</span>ください</h1>
            <Button onClick={() => StateTransitions.START_TRAINING(updateFunctions)}>
              スタート
            </Button>
          </div>
        )}

        {/* おぼえよう！のスタート画面 */}
        {StateCheckers.isMemorizeStartScreen(state) && (
          <div className={styles.startScreen}>
            <h1>かんじを<span>おぼえよう</span></h1>
            <Button onClick={() => StateTransitions.START_TRAINING(updateFunctions, { repetitionCount: state.repetitionCount })}>
              スタート
            </Button>
          </div>
        )}

        {/* おぼえよう！の学習終了後のボタン */}
        {StateCheckers.isMemorizeComplete(state) && (
          <div className={styles.buttonGroup}>
            <Button onClick={() => StateTransitions.START_TRAINING(updateFunctions, { repetitionCount: state.repetitionCount })}>
              もういちど
            </Button>
            <Button onClick={() => StateTransitions.TRANSITION_TO_CONFIRM(updateFunctions, { 
              confirmationCount: state.confirmationCount,
              repetitionCount: state.repetitionCount 
            })}>
              たしかめよう
            </Button>
          </div>
        )}

        {/* たしかめよう！の学習終了後のボタン */}
        {StateCheckers.isConfirmComplete(state) && (
          <div className={styles.buttonGroup}>
            <Button onClick={() => StateTransitions.RETURN_TO_MEMORIZE(updateFunctions, state)}>
              もういちど　おぼえよう
            </Button>
            <Button onClick={() => StateTransitions.RETURN_TO_METHOD_SELECTION(updateFunctions)}>
              はじめにもどる
            </Button>
          </div>
        )}
      </>
    );
};
  