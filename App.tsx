import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { database } from './firebaseConfig'; // firebaseConfig.ts から database をインポート
import { ref, onValue, set } from 'firebase/database'; // ref, onValue, set をインポート

// こどもプロフィールの「型」を定義するお部屋（インターフェース）
interface ChildProfile {
  id: string; // こどもを識別するための一意のID
  name: string; // こどもの名前
  currentTaskId?: string; // 現在フォーカスしているタスクのID (任意)
}

// 毎日やる宿題の「種類」を定義するお部屋（インターフェース）
interface DailyTask {
  id: string;
  name: string;
  isCompleted: boolean;
}

// テスト用のダミーこどもデータ
const dummyChildren: ChildProfile[] = [
  { id: 'child1', name: 'たろう' },
  { id: 'child2', name: 'はなこ' },
  { id: 'child3', name: 'けんた' },
  { id: 'child4', name: 'りょうせい' },
  { id: 'child5', name: 'ねね' },
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
function MainScreen({ navigation, selectedDate, currentChild, setCurrentChildId }: any) {
  // 日次タスクのリストとその完了状態を管理するstate
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(dummyDailyTasks);
  
  // ★useEffect を使ってFirebaseからデータを読み込む
  useEffect(() => {
    if (!currentChild) return; // currentChild がない場合は何もしない

    // Firebase Realtime Database の参照パスを定義
    // 例: /children/child1/tasks
    const tasksRef = ref(database, `children/${currentChild.id}/tasks`);

    // データの変更を監視
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebaseから読み込んだデータをDailyTask[]の形式に変換
        const loadedTasks: DailyTask[] = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          isCompleted: data[key].isCompleted || false, // isCompleted がない場合はfalse
        }));
        setDailyTasks(loadedTasks);
      } else {
        setDailyTasks(dummyDailyTasks);
        if (currentChild) {
          saveTasksToFirebase(dummyDailyTasks, currentChild.id); // ★この行を追加
        }
      }
    });

    // コンポーネントがアンマウントされるときに監視を解除
    return () => {
      unsubscribe();
    };
  }, [currentChild]); // currentChild が変更されたときに再実行

  // タスクの完了状態を切り替える関数
  const toggleTaskCompletion = (taskId: string) => {
  setDailyTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      );
      // ★Firebaseに保存する
      if (currentChild) {
        saveTasksToFirebase(updatedTasks, currentChild.id);
      }
      return updatedTasks;
    });
  };

  // ★Firebaseにタスクデータを保存する関数
const saveTasksToFirebase = (tasks: DailyTask[], childId: string) => {
  const tasksData: { [key: string]: { name: string; isCompleted: boolean } } = {};
  tasks.forEach(task => {
    tasksData[task.id] = { name: task.name, isCompleted: task.isCompleted };
  });
  // Firebase Realtime Database の参照パスを定義
  // 例: /children/child1/tasks
  const tasksRef = ref(database, `children/${childId}/tasks`);
  set(tasksRef, tasksData)
    .then(() => {
      console.log('Tasks saved to Firebase successfully!');
    })
    .catch((error) => {
      console.error('Error saving tasks to Firebase:', error);
    });
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

      {/* 次のこどもへ切り替えるボタン */}
      <Button
        title="次のこどもへ"
        onPress={() => {
          // 現在のこどものインデックスを見つける
          const currentIndex = dummyChildren.findIndex(
            (child) => child.id === currentChild?.id
          );
          // 次のインデックスを計算（リストの最後なら最初に戻る）
          const nextIndex = (currentIndex + 1) % dummyChildren.length;
          // 次のこどものIDに更新
          setCurrentChildId(dummyChildren[nextIndex].id); // ★setCurrentChildId は App コンポーネントから渡される想定
        }}
      />

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
              setCurrentChildId={setCurrentChildId}
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
    padding: 20,
  },
  childName: {
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
  taskList: {
    width: '80%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  taskItem: {
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
  completedTaskName: {
    textDecorationLine: 'line-through', // 打ち消し線
    color: '#888', // 灰色にする
  },
  checkMark: {
    fontSize: 20,
    color: 'green',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});