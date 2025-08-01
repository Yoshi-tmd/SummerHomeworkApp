// screens/MainScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert, Platform, ActivityIndicator, FlatList, ScrollView } from 'react-native'; // ScrollViewとFlatListを追加

import { database } from '../firebaseConfig'; // Firebase Realtime Database
import { ref, onValue, set } from 'firebase/database';
import { auth } from '../firebaseConfig'; // Firebase Authのインスタンス
import { signOut } from 'firebase/auth'; // ログアウト関数

// types.ts から必要な型をインポート
import { ChildProfile, DailyTask, DeadlineTask, TaskStatus, TaskType } from '../types';
import { format } from 'date-fns'; // date-fnsのformat関数をインポート
import { SafeAreaView } from 'react-native-safe-area-context'; // SafeAreaViewをインポート

// メイン画面コンポーネント
function MainScreen({ navigation, selectedDate, currentChild, setCurrentChildId, userId }: any) {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]); // 初期値を空にする
  const [deadlineTasks, setDeadlineTasks] = useState<DeadlineTask[]>([]); // 期限付きタスク用
  const [loadingTasks, setLoadingTasks] = useState(true); // ローディング状態を追加

  // Firebaseから日次タスクと期限付きタスクを読み込む
  useEffect(() => {
    if (!userId || !currentChild) {
      // ユーザーIDまたは子どもの選択がない場合はタスクをクリアし、ローディングを終了
      setDailyTasks([]);
      setDeadlineTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true); // データ読み込み開始時にローディングをtrueに

    // 日次タスクの参照パス (HomeworkManagementScreen.tsxとパスを統一)
    const dailyTasksRef = ref(database, `users/${userId}/children/${currentChild.id}/dailyTasks`);
    // 期限付きタスクの参照パス (HomeworkManagementScreen.tsxとパスを統一)
    const deadlineTasksRef = ref(database, `users/${userId}/children/${currentChild.id}/deadlineTasks`);

    // 日次タスクの監視
    const unsubscribeDaily = onValue(dailyTasksRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTasks: DailyTask[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          loadedTasks.push({ id: key, ...data[key] });
        });
      }
      setDailyTasks(loadedTasks);
    });

    // 期限付きタスクの監視
    const unsubscribeDeadline = onValue(deadlineTasksRef, (snapshot) => {
        const data = snapshot.val();
        const loadedTasks: DeadlineTask[] = [];
        if (data) {
          Object.keys(data).forEach(key => {
            loadedTasks.push({ id: key, ...data[key] });
          });
        }
        setDeadlineTasks(loadedTasks);
        setLoadingTasks(false); // 全てのデータ読み込み完了時にローディングをfalseに
      });

    // コンポーネントがアンマウントされるときに監視を解除
    return () => {
      unsubscribeDaily();
      unsubscribeDeadline();
    };
  }, [userId, currentChild]); // userId または currentChild が変更されたら再読み込み

  // タスクの完了状態を切り替える関数（Firebaseと連携）
  const toggleTaskStatus = async (task: DailyTask | DeadlineTask) => {
    if (!userId || !currentChild) return;

    // 現在のステータスが 'completed' なら 'notStarted' に、そうでなければ 'completed' にする
    const newStatus: TaskStatus = task.status === 'completed' ? 'notStarted' : 'completed';
    const taskPath = `users/${userId}/children/${currentChild.id}/${task.type}Tasks/${task.id}`;
    const taskRef = ref(database, taskPath);

    try {
      await set(taskRef, { ...task, status: newStatus, updatedAt: new Date().toISOString() });
    } catch (error: any) {
      Alert.alert('エラー', 'タスクのステータス更新に失敗しました: ' + error.message);
      console.error('Error updating task status:', error);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase AuthのsignOut関数を直接使用
      Alert.alert('ログアウト', 'ログアウトしました。');
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      Alert.alert('エラー', error.message || 'ログアウトに失敗しました。');
    }
  };

  // ローディング中の表示
  if (loadingTasks) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>タスクを読み込み中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.title}>メイン画面</Text>

          <Text style={styles.dateText}>{format(selectedDate, 'yyyy年MM月dd日 (E)')}</Text>

          {/* 現在選択中のこども表示 */}
          {currentChild ? (
            <View style={styles.childInfoContainer}>
              <Text style={styles.childName}>対象のこども: {currentChild.name}</Text>
              {/* 子ども切り替えボタン */}
              <TouchableOpacity onPress={() => setCurrentChildId()} style={styles.changeChildButton}>
                <Text style={styles.changeChildButtonText}>切り替え</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noChildContainer}>
              <Text style={styles.noChildText}>こどもが選択されていません。</Text>
              <Button
                title="こどもを追加/選択"
                onPress={() => navigation.navigate('FamilyManagement')}
              />
            </View>
          )}

          {currentChild && ( // currentChild が選択されている場合のみタスクを表示
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>日次タスク</Text>
                {dailyTasks.length === 0 ? (
                  <Text style={styles.noTasksMessage}>日次タスクがありません。</Text>
                ) : (
                  <FlatList
                    data={dailyTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.taskItem, item.status === 'completed' ? styles.completedTask : null]}
                        onPress={() => toggleTaskStatus(item)}
                      >
                        <Text style={styles.taskNameStyle}>{item.name}</Text>
                        {item.description && <Text style={styles.taskDescriptionStyle}>{item.description}</Text>}
                        <Text style={styles.taskStatusStyle}>
                          {item.status === 'completed' ? '完了' : '未完了'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.flatListContent}
                    scrollEnabled={false}
                  />
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>期限付きタスク</Text>
                {deadlineTasks.length === 0 ? (
                  <Text style={styles.noTasksMessage}>期限付きタスクがありません。</Text>
                ) : (
                  <FlatList
                    data={deadlineTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.taskItem, item.status === 'completed' ? styles.completedTask : null]}
                        onPress={() => toggleTaskStatus(item)}
                      >
                        <Text style={styles.taskNameStyle}>{item.name}</Text>
                        {item.description && <Text style={styles.taskDescriptionStyle}>{item.description}</Text>}
                        <Text style={styles.taskDeadlineStyle}>
                          期限: {format(new Date((item as DeadlineTask).deadline), 'yyyy/MM/dd HH:mm')}
                        </Text>
                        <Text style={styles.taskStatusStyle}>
                          {item.status === 'completed' ? '完了' : '未完了'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.flatListContent}
                    scrollEnabled={false}
                  />
                )}
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="カレンダー画面へ"
              onPress={() => navigation.navigate('Calendar')}
            />

            <View style={{ height: 20 }} />
            <Button
              title="宿題管理"
              onPress={() => {
                if (!currentChild) {
                  Alert.alert('エラー', '宿題管理画面に移動するには、まずこどもを選択してください。');
                  return;
                }
                navigation.navigate('HomeworkManagement');
              }}
              color="#FF5733"
            />

            <View style={{ height: 20 }} />
            <Button
              title="家族・子ども管理"
              onPress={() => navigation.navigate('FamilyManagement')}
              color="#007bff"
            />

            <View style={{ height: 20 }} />
            <Button
              title="ログアウト"
              onPress={handleLogout}
              color="red"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: { // ScrollView の中身全体に適用するスタイル
    flexGrow: 1, // コンテンツが画面の高さより小さい場合でも、ScrollView が最低限の高さを持つようにする
    alignItems: 'center', // コンテンツを中央寄せに保つ
    paddingHorizontal: 20, // 左右のパディング
    paddingTop: Platform.OS === 'android' ? 20 : 0, // Androidの上部パディングを維持
    paddingBottom: 20, // 下部にも少しパディングを追加
  },
  container: {
    width: '100%', // ScrollView の中で幅を確保
    // alignItems は必要であれば保持
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  dateText: {
    fontSize: 20,
    marginBottom: 20,
  },
  childInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  changeChildButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  changeChildButtonText: {
    color: 'white',
    fontSize: 14,
  },
  noChildContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  noChildText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  noTasksMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  taskItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  completedTask: {
    backgroundColor: '#e0ffe0',
    borderColor: '#aaffaa',
    opacity: 0.7,
  },
  taskNameStyle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescriptionStyle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  taskDeadlineStyle: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 5,
    fontWeight: 'bold',
  },
  taskStatusStyle: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  flatListContent: {
    paddingBottom: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default MainScreen;