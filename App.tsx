import React, { useState } from 'react'; // useState をインポート
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// こどもプロフィールの「型」を定義するお部屋（インターフェース）
interface ChildProfile {
  id: string; // こどもを識別するための一意のID
  name: string; // こどもの名前
  currentTaskId?: string; // 現在フォーカスしているタスクのID (任意)
  // 他にも年齢や学年など、必要に応じて追加できます
}

// 毎日やる宿題の「種類」を定義するお部屋（インターフェース）
interface DailyTask {
  id: string;
  name: string;
  isCompleted: boolean; // ★追加：タスクが完了したかどうか
}

// テスト用のダミーこどもデータ
const dummyChildren: ChildProfile[] = [
  { id: 'child1', name: 'たろう' },
  { id: 'child2', name: 'はなこ' },
  { id: 'child3', name: 'けんた' },
];
// テスト用のダミー日次タスクデータ
const dummyDailyTasks: DailyTask[] = [
  { id: 'task1', name: '漢字練習', isCompleted: false },
  { id: 'task2', name: '計算ドリル', isCompleted: false },
  { id: 'task3', name: '音読', isCompleted: false },
  { id: 'task4', name: '日記', isCompleted: false },
];

// スタックナビゲーターを作成
const Stack = createStackNavigator();

// メイン画面コンポーネント
// Propsとしてnavigation, selectedDate, currentChildを受け取る
function MainScreen({ navigation, selectedDate, currentChild }: any) {
  // 日次タスクのリストとその完了状態を管理するstate
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(dummyDailyTasks);
  
  // タスクの完了状態を切り替える関数
  const toggleTaskCompletion = (taskId: string) => {
    setDailyTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  // 曜日名を取得するヘルパー関数
  const getDayName = (day: number) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[day];
  };

  // 曜日によって色を変えるヘルパー関数
  const getDayColor = (day: number) => {
    switch (day) {
      case 0: // 日曜日
        return 'red';
      case 6: // 土曜日
        return 'blue';
      default: // 平日
        return 'black';
    }
  };

  return (
    <View style={styles.container}>
      {/* 現在のこどもの名前を表示 */}
      {currentChild && (
        <Text style={styles.childName}>
          {currentChild.name} の宿題
        </Text>
      )}

      {/* 日付の表示 */}
      <Text style={[styles.dateText, { color: getDayColor(selectedDate.getDay()) }]}>
        {`${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 (${getDayName(selectedDate.getDay())})`}
      </Text>

      <Text style={styles.title}>メイン画面（日次進捗）</Text>

      <View style={styles.taskList}>
        {dailyTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskItem}
            onPress={() => toggleTaskCompletion(task.id)}
          >
            <Text
              style={[
                styles.taskName,
                task.isCompleted && styles.completedTaskName,
              ]}
            >
              {task.name}
            </Text>
            {task.isCompleted && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="カレンダー画面へ"
        onPress={() => navigation.navigate('Calendar')}
      />
    </View>
  );
}

// カレンダー画面コンポーネント
function CalendarScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>カレンダー画面</Text>
      <Button
        title="メイン画面へ"
        onPress={() => navigation.navigate('Main')}
      />
    </View>
  );
}

// アプリのメインコンポーネント
export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 現在選択されているこどものIDを管理するstate
  // 初期値として、ダミーデータの最初のこどものIDを設定
  const [currentChildId, setCurrentChildId] = useState<string>(dummyChildren[0].id);

  // 現在選択されているこどものプロフィールを見つける
  const currentChild = dummyChildren.find(
    (child) => child.id === currentChildId
  );

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main">
          {(props) => (
            <MainScreen
              {...props}
              selectedDate={selectedDate}
              currentChild={currentChild} // currentChildをMainScreenに渡す
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Calendar" component={CalendarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20, // コンテンツが端に寄りすぎないようにパディングを追加
  },
  childName: { // 新しく追加したスタイル
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dateText: {
    fontSize: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  taskList: { // ← 新しく追加
    width: '80%', // リストの幅
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  taskItem: { // ← 新しく追加
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row', // チェックボックスとテキストを横並びにするため
    alignItems: 'center',
  },
  taskName: {
    fontSize: 18,
    marginLeft: 10,
    flex: 1, // テキストがチェックマークのスペースを考慮して広がるように
  },
  completedTaskName: { // ★追加：完了したタスクのテキストスタイル
    textDecorationLine: 'line-through', // 打ち消し線
    color: '#888', // 灰色にする
  },
  checkMark: { // ★追加：チェックマークのスタイル
    fontSize: 20,
    color: 'green',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // 必要に応じて、他のスタイルもここに追加できます
});