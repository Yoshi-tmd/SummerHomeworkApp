import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MainScreen from './screens/MainScreen';
import CalendarScreen from './screens/CalendarScreen';
import AuthScreen from './screens/AuthScreen';
import FamilyManagementScreen from './screens/FamilyManagementScreen';

import { auth } from './auth';
import { database } from './firebaseConfig';
import { ref, onValue } from 'firebase/database';
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

// こどもプロフィールの「型」を定義するお部屋（インターフェース）
interface ChildProfile {
  id: string; // こどもを識別するための一意のID
  name: string; // こどもの名前
  // FamilyManagementScreen と整合性を持たせる
  age?: number;
  grade?: string;
}

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

  const [children, setChildren] = useState<ChildProfile[]>([]); // Firebaseから読み込む子どもデータを保持するstate

  // 現在選択されているこどものIDを管理するstate
  // 初期値として、ダミーデータの最初のこどものIDを設定
  const [currentChildId, setCurrentChildId] = useState<string | null>(null); // 初期値をnullに変更

  const [user, setUser] = useState<User | null>(null); // ユーザー情報を保持するstate
  const [loadingAuth, setLoadingAuth] = useState(true); // 認証状態の初期ロードを示すstate

  // 認証状態の変更を監視するuseEffect
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      // ログイン状態が変わった時にこども選択をリセット
      setCurrentChildId(null);
    });
    return () => unsubscribeAuth();
  }, []);

  // Firebaseから子どもデータを読み込むuseEffect
  useEffect(() => {
    if (!user) {
      setChildren([]); // ログアウト時は子どもデータをクリア
      setCurrentChildId(null);
      return;
    }

    const childrenRef = ref(database, `users/${user.uid}/children`);
    const unsubscribeChildren = onValue(childrenRef, (snapshot) => {
      const data = snapshot.val();
      let loadedChildren: ChildProfile[] = [];
      if (data) {
        loadedChildren = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          age: data[key].age,
          grade: data[key].grade,
        }));
      }
      setChildren(loadedChildren);

      // 子供が読み込まれたら、現在の選択中の子供を更新
      if (loadedChildren.length > 0) {
        // 現在選択中の子供が削除されていたり、未設定だったりしたら最初の子供を選択
        if (!currentChildId || !loadedChildren.some(child => child.id === currentChildId)) {
          setCurrentChildId(loadedChildren[0].id);
        }
      } else {
        setCurrentChildId(null); // 子供がいなければ選択解除
      }
    });

    return () => unsubscribeChildren();
  }, [user, currentChildId]); // user または currentChildId が変更されたときに再実行


  // 現在選択されているこどもを children state から見つける
  const currentChild = children.find(
    (child) => child.id === currentChildId
  );

  // 「次のこどもへ」ボタンのロジック
  const goToNextChild = () => {
    if (children.length === 0) return; // 子供がいない場合は何もしない
    if (!currentChildId) { // 何も選択されていない場合は最初の子供へ
      setCurrentChildId(children[0].id);
      return;
    }
    const currentIndex = children.findIndex(
      (child) => child.id === currentChild?.id
    );
    const nextIndex = (currentIndex + 1) % children.length;
    setCurrentChildId(children[nextIndex].id);
  };

  if (loadingAuth) {
      // 認証状態の確認中はローディングインジケータを表示
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0000ff" />
          </View>
      );
  }

  // ログイン済みだが子供がまだ読み込まれていない、または子供が一人も登録されていない場合の考慮
  if (user && children.length === 0 && !loadingAuth) {
    // ロード中ではないが子供がいない場合、管理画面へ促す
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="FamilyManagement">
          <Stack.Screen name="FamilyManagement" options={{ headerShown: false }}>
            {(props) => (
              <FamilyManagementScreen
                {...props}
                userId={user.uid}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
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
                  userId={user.uid}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="FamilyManagement" options={{ headerShown: false }}>
              {(props) => (
                <FamilyManagementScreen
                  {...props}
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