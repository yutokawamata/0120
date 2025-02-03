const titleStyle = {
    width: "100%",         // 幅を画面に応じて変化
    maxWidth: "1200px",     // 最大幅を制限
    height: "60px",
    padding: "8px",
    margin: "10px",
    fontSize: "48px",   
    borderRadius: "8px",
    textAlign: "center",
    boxSizing: "border-box", // パディングを含めたサイズ計算
   //position: "fixed", // 固定位置
    //top: 50            // 上部に固定
  };
  
  /**
   * タイトルコンポーネント
   * 現在の画面状態に応じて適切なタイトルを表示する
   * @param {Object} props
   * @param {Object} props.state - アプリケーションの状態
   */
  export const Title = ({ state }) => {
    if (state.isTraining !== "initial") return null;

    return (
      <div style={titleStyle}>
        {/* 初期画面のタイトル */}
        {state.selectedLevel === "initial" && (
          <h3>かんじチャレンジ</h3>
        )}

        {/* 漢字選択画面のタイトル */}
        {!state.selectNext && state.selectedLevel !== "initial" && (
          <h3>漢字を選ぶ</h3>
        )}


        {/* 反復回数選択画面のタイトル */}
        {state.selectNext && state.repetitionCount === "initial" && (
          <h3>反復回数選択</h3>
        )}


        {/* たしかめよう回数選択画面のタイトル */}
        {state.selectNext && state.selectedOption === "remember" && 
         state.repetitionCount !== "initial" && state.confirmationCount === "initial" && (
          <h3>たしかめよう回数選択</h3>
        )}

      </div>
    );
  };
  