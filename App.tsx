// App.tsx
import React, { useState } from 'react'; // useState をインポート
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- データ構造の定義 (interface) ---

// 毎日やる宿題の各項目を定義するインターフェース
interface DailyTask {
  id: string;   // 宿題の一意なID (例: "natsuyasumi-no-tomo")
  name: string; // 宿題の表示名 (例: "なつやすみのとも")
}

// その日の宿題の進捗を管理するインターフェース
interface DailyTaskStatus {
  taskId: string;   // DailyTaskのIDを参照
  completed: boolean; // その日が完了したかどうかのフラグ
}

// MainScreenにnavigation propの型を定義
type MainScreenProps = {
  navigation: any; // より厳密な型は後で導入します
};

const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  // --- ここからMainScreenの状態管理 ---

  // 1. 現在表示している日付を管理するState
  // 初期値は今日の日付に設定します
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // 2. 毎日やる宿題のリスト（ダミーデータ）
  // 後でFirebaseから取得するようにしますが、まずはこれで表示を確認します
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: 'natsuyasumi-no-tomo', name: 'なつやすみのとも' },
    { id: 'asagao-mizuyari', name: 'あさがおの水やりと観察' },
    { id: 'keisan-renshu', name: '計算練習（足し算・引き算）' },
    { id: 'keisan-drill', name: 'けいさんドリル' },
    { id: 'dokusho', name: 'どくしょ（登校日までに5冊以上）' },
    { id: 'keikaku-check', name: 'なつやすみの計画のチェック' },
    { id: 'kenkou-calendar', name: 'けんこうせいかつカレンダー' },
  ]);

  // --- 日付表示のためのヘルパー関数 ---
  // 例: "7月20日 (土)" のような形式に整形します
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1; // 月は0から始まるため+1
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = weekdays[date.getDay()]; // getDay() は曜日を数値で返す (0=日, 1=月, ...)
    return `${month}月${day}日 (${dayOfWeek})`;
  };

  // --- 曜日の色分けのためのヘルパー関数 ---
  // 土曜は青、日曜は赤のスタイルを返します
  const getDayOfWeekColor = (date: Date) => {
    const day = date.getDay(); // 0:日曜日, 1:月曜日, ..., 6:土曜日
    if (day === 0) { // 日曜日
      return styles.sundayText;
    } else if (day === 6) { // 土曜日
      return styles.saturdayText;
    }
    return null; // 平日は特別な色なし
  };

  return (
    <View style={styles.screenContainer}>
      {/* 画面上部に日付表示 */}
      <View style={styles.dateDisplayContainer}>
        <Text style={[styles.dateDisplayText, getDayOfWeekColor(currentDate)]}>
          {formatDate(currentDate)}
        </Text>
      </View>

      <Text style={styles.screenTitle}>メイン画面（日次進捗）</Text>
      <Button
        title="カレンダー画面へ"
        onPress={() => navigation.navigate('Calendar')}
      />
      {/* 今後、ここに毎日やる宿題のチェックリストなどを追加します */}
    </View>
  );
};

// CalendarScreenにnavigation propの型を定義
type CalendarScreenProps = {
  navigation: any;
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>カレンダー画面（計画・全体進捗）</Text>
      <Button
        title="メイン画面へ"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

// --- スタックナビゲーターの作成 ---
const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ headerShown: false }} // メイン画面のヘッダーを非表示にする（日付表示をカスタムするため）
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'カレンダー' }}
        />
        {/* 今後、こども選択/設定画面などもここに追加します */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- スタイル定義 ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 50, // 上部に余白
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center', // タイトルは中央揃え
  },
  dateDisplayContainer: {
    width: '100%', // 親要素の幅いっぱいに広げる
    alignItems: 'center', // 日付を中央揃え
    marginBottom: 20,
  },
  dateDisplayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333', // デフォルトの文字色
  },
  saturdayText: {
    color: 'blue', // 土曜日は青
  },
  sundayText: {
    color: 'red', // 日曜日は赤
  },
});

export default App;
