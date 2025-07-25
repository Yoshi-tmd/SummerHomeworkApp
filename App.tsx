import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MainScreen from './screens/MainScreen';
import CalendarScreen from './screens/CalendarScreen';
import AuthScreen from './screens/AuthScreen';

import { auth } from './auth';
import { User, onAuthStateChanged } from 'firebase/auth';

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
  const [currentChildId, setCurrentChildId] = useState<string | null>(null); // ★初期値をnullに変更

  const [user, setUser] = useState<User | null>(null); // ユーザー情報を保持するstate
  const [loadingAuth, setLoadingAuth] = useState(true); // 認証状態の初期ロードを示すstate

  // 認証状態の変更を監視するuseEffect
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          if (currentUser && dummyChildren.length > 0) {
            // ログイン時、かつダミーの子供がいる場合のみ最初の子供を設定
            setCurrentChildId(dummyChildren[0].id);
          } else if (!currentUser) {
            // ログアウト時は子供の選択をクリア
            setCurrentChildId(null);
          }
          setLoadingAuth(false); // 認証状態のロードが完了
      });

      // クリーンアップ関数
      return () => unsubscribe();
  }, []);

  // 現在選択されているこどものプロフィールを見つける
  const currentChild = dummyChildren.find(
    (child) => child.id === currentChildId
  );

  // 「次のこどもへ」ボタンのロジック
  const goToNextChild = () => {
    if (!currentChildId) return; // 子供が選択されていない場合は何もしない
    const currentIndex = dummyChildren.findIndex(
      (child) => child.id === currentChild?.id
    );
    const nextIndex = (currentIndex + 1) % dummyChildren.length;
    setCurrentChildId(dummyChildren[nextIndex].id);
  };

  if (loadingAuth) {
      // 認証状態の確認中はローディングインジケータを表示
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0000ff" />
          </View>
      );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Main" : "Auth"}>
        {user ? (
          <React.Fragment>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => (
                <MainScreen
                  {...props}
                  selectedDate={selectedDate}
                  currentChild={currentChild}
                  setCurrentChildId={goToNextChild}
                  dummyChildren={dummyChildren}
                  userId={user.uid}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Calendar" options={{ headerShown: false }}>
              {(props) => (
                <CalendarScreen
                  {...props}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  currentChild={currentChild}
                  setCurrentChildId={goToNextChild}
                  dummyChildren={dummyChildren}
                  userId={user.uid}
                />
              )}
            </Stack.Screen>
          </React.Fragment>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} /> // ヘッダーを非表示
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  //スタイルは移した
});