import React, { useState } from 'react';
import { StyleSheet } from 'react-native'; // View, Button, Text, TouchableOpacity はもう不要
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MainScreen from './screens/MainScreen';
import CalendarScreen from './screens/CalendarScreen';

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

  // ★「次のこどもへ」ボタンのロジックを App.tsx に移動
  const goToNextChild = () => {
    const currentIndex = dummyChildren.findIndex(
      (child) => child.id === currentChild?.id
    );
    const nextIndex = (currentIndex + 1) % dummyChildren.length;
    setCurrentChildId(dummyChildren[nextIndex].id);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main">
          {(props) => (
            <MainScreen
              {...props}
              selectedDate={selectedDate}
              currentChild={currentChild}
              setCurrentChildId={goToNextChild} // ★関数を渡すように修正
              dummyChildren={dummyChildren} // ★dummyChildren を MainScreen に渡す
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
  //スタイルは移した
});