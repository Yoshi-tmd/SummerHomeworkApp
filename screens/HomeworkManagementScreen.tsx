// screens/HomeworkManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Button, FlatList,
  TouchableOpacity, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue, set, remove } from 'firebase/database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; // 日付選択ピッカー
import { format } from 'date-fns'; // 日付フォーマット用

// 共通型定義のインポート
import { ChildProfile, DailyTask, DeadlineTask, TaskStatus, TaskType } from '../types';

// この画面で受け取るPropsの型定義
interface HomeworkManagementScreenProps {
  navigation: any;
  userId: string;
  currentChild: ChildProfile | null | undefined;
}

function HomeworkManagementScreen({ navigation, userId, currentChild }: HomeworkManagementScreenProps) {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [deadlineTasks, setDeadlineTasks] = useState<DeadlineTask[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('daily'); // 'daily' or 'deadline'
  const [newDeadline, setNewDeadline] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | DeadlineTask | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // 現在表示するタスクの種類（日次 or 期限付き）
  const [activeTab, setActiveTab] = useState<TaskType>('daily');

  // Firebaseから宿題データを読み込む
  useEffect(() => {
    if (!userId || !currentChild) {
      setDailyTasks([]);
      setDeadlineTasks([]);
      return;
    }

    const dailyTasksRef = ref(database, `users/${userId}/children/${currentChild.id}/dailyTasks`);
    const deadlineTasksRef = ref(database, `users/${userId}/children/${currentChild.id}/deadlineTasks`);

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

    const unsubscribeDeadline = onValue(deadlineTasksRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTasks: DeadlineTask[] = [];
      if (data) {
        Object.keys(data).forEach(key => {
          loadedTasks.push({ id: key, ...data[key] });
        });
      }
      setDeadlineTasks(loadedTasks);
    });

    return () => {
      unsubscribeDaily();
      unsubscribeDeadline();
    };
  }, [userId, currentChild]); // currentChildが変更されたら再読み込み

  // タスクを追加または更新する
  const handleAddOrUpdateTask = async () => {
    if (!currentChild) {
      Alert.alert('エラー', 'こどもが選択されていません。');
      return;
    }
    if (newTaskName.trim() === '') {
      Alert.alert('エラー', 'タスク名を入力してください。');
      return;
    }
    if (newTaskType === 'deadline' && newDeadline < new Date()) {
        Alert.alert('エラー', '期限は現在時刻以降に設定してください。');
        return;
    }

    try {
      const now = new Date().toISOString(); // ISO文字列で現在時刻を記録
      let taskData: Omit<DailyTask, 'id'> | Omit<DeadlineTask, 'id'>;
      let taskRef;

      if (editingTask) {
        // 更新処理
        taskData = {
            ...editingTask, // 既存のデータをコピー
            name: newTaskName,
            description: newTaskDescription,
            updatedAt: now,
            // タイプが変更された場合のハンドリングは別途考慮が必要（今回は単純化）
            // type: newTaskType, // タイプ変更を許可するなら
        };
        if (newTaskType === 'deadline') {
            (taskData as DeadlineTask).deadline = newDeadline.toISOString();
        } else {
            // dailyからdeadlineに切り替えた場合、古いdeadlineプロパティを削除したいが、
            // 今回はtypeが変更された場合のロジックは複雑になるため、
            // 編集時は元のtaskTypeを維持すると仮定します。
            // 厳密には、typeが変わったらFirebaseのパスも変わるので、削除＆追加になります。
        }

        taskRef = ref(database, `users/${userId}/children/${currentChild.id}/${editingTask.type}Tasks/${editingTask.id}`);
        await set(taskRef, taskData);
        Alert.alert('成功', 'タスクを更新しました。');

      } else {
        // 追加処理
        const newId = uuidv4();
        taskData = {
          name: newTaskName,
          description: newTaskDescription,
          type: newTaskType,
          status: 'notStarted', // 新規タスクは未開始
          createdAt: now,
          updatedAt: now,
        };
        if (newTaskType === 'deadline') {
          (taskData as DeadlineTask).deadline = newDeadline.toISOString();
        }

        taskRef = ref(database, `users/${userId}/children/${currentChild.id}/${newTaskType}Tasks/${newId}`);
        await set(taskRef, { id: newId, ...taskData });
        Alert.alert('成功', '新しいタスクを追加しました。');
      }

      // フォームをリセットして閉じる
      resetForm();
    } catch (error: any) {
      Alert.alert('エラー', '処理中に問題が発生しました: ' + error.message);
      console.error('Error adding/updating task:', error);
    }
  };

  // 編集モードにする
  const startEditing = (task: DailyTask | DeadlineTask) => {
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description || '');
    setNewTaskType(task.type);
    if (task.type === 'deadline') {
      setNewDeadline(new Date((task as DeadlineTask).deadline));
    } else {
        setNewDeadline(new Date()); // 日次タスクの場合は日付をリセット
    }
    setIsFormVisible(true);
  };

  // タスクを削除する
  const handleDeleteTask = async (taskId: string, taskType: TaskType) => {
    if (!currentChild) return;

    Alert.alert(
      '確認',
      'このタスクを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            try {
              const taskRef = ref(database, `users/${userId}/children/${currentChild.id}/${taskType}Tasks/${taskId}`);
              await remove(taskRef);
              Alert.alert('削除完了', 'タスクが削除されました。');
              // 削除したタスクが編集中のものだった場合、フォームをリセット
              if (editingTask && editingTask.id === taskId && editingTask.type === taskType) {
                resetForm();
              }
            } catch (error: any) {
              Alert.alert('エラー', '削除中に問題が発生しました: ' + error.message);
              console.error('Error deleting task:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // タスクのステータスを更新する
  const handleUpdateTaskStatus = async (task: DailyTask | DeadlineTask, newStatus: TaskStatus) => {
    if (!currentChild) return;

    try {
      const taskRef = ref(database, `users/${userId}/children/${currentChild.id}/${task.type}Tasks/${task.id}`);
      await set(taskRef, { ...task, status: newStatus, updatedAt: new Date().toISOString() });
      // Alert.alert('成功', 'タスクのステータスを更新しました。'); // スムーズな操作のためアラートは出さない
    } catch (error: any) {
      Alert.alert('エラー', 'ステータス更新中に問題が発生しました: ' + error.message);
      console.error('Error updating task status:', error);
    }
  };


  // フォームをリセットして閉じる
  const resetForm = () => {
    setEditingTask(null);
    setNewTaskName('');
    setNewTaskDescription('');
    setNewTaskType('daily'); // デフォルトは日次タスク
    setNewDeadline(new Date());
    setIsFormVisible(false);
    setShowDatePicker(false);
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || newDeadline;
    setShowDatePicker(Platform.OS === 'ios'); // iOSでは選択後も表示し続けるため、条件付きで非表示
    setNewDeadline(currentDate);
  };

  // 現在表示するタスクのリストを取得
  const tasksToDisplay = activeTab === 'daily' ? dailyTasks : deadlineTasks;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          data={tasksToDisplay} // 表示するタスクリストを動的に切り替え
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskName}>{item.name}</Text>
              {item.description && <Text style={styles.taskDescription}>{item.description}</Text>}
              {item.type === 'deadline' && (
                <Text style={styles.taskDeadline}>期限: {format((item as DeadlineTask).deadline, 'yyyy/MM/dd HH:mm')}</Text>
              )}
              <Text style={styles.taskStatus}>状態: {item.status === 'notStarted' ? '未開始' : item.status === 'inProgress' ? '進行中' : '完了'}</Text>
              <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => startEditing(item)} style={[styles.taskButton, styles.editButton]}>
                  <Text style={styles.buttonText}>編集</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(item.id, item.type)} style={[styles.taskButton, styles.deleteButton]}>
                  <Text style={styles.buttonText}>削除</Text>
                </TouchableOpacity>
                {item.status !== 'completed' && (
                    <TouchableOpacity
                        onPress={() => handleUpdateTaskStatus(item, 'completed')}
                        style={[styles.taskButton, styles.completeButton]}
                    >
                        <Text style={styles.buttonText}>完了</Text>
                    </TouchableOpacity>
                )}
                 {item.status === 'completed' && (
                    <TouchableOpacity
                        onPress={() => handleUpdateTaskStatus(item, 'notStarted')}
                        style={[styles.taskButton, styles.revertButton]}
                    >
                        <Text style={styles.buttonText}>未完了に戻す</Text>
                    </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.title}>宿題管理</Text>
              {currentChild && <Text style={styles.currentChildName}>対象のこども: {currentChild.name}</Text>}
              {!currentChild && <Text style={styles.noChildSelected}>こどもが選択されていません。メイン画面でこどもを選択するか、家族・子ども管理画面で追加してください。</Text>}

              {/* タブ切り替え */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'daily' && styles.activeTab]}
                  onPress={() => setActiveTab('daily')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'daily' && styles.activeTabText]}>日次タスク</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'deadline' && styles.activeTab]}
                  onPress={() => setActiveTab('deadline')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'deadline' && styles.activeTabText]}>期限付きタスク</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                {activeTab === 'daily' ? '日次タスク一覧' : '期限付きタスク一覧'}
              </Text>
              {tasksToDisplay.length === 0 && (
                <Text style={styles.noTaskText}>
                  {activeTab === 'daily' ? '日次タスク' : '期限付きタスク'}がまだ登録されていません。「タスクを追加」ボタンから追加してください。
                </Text>
              )}

              {/* 「タスクを追加」ボタン（フォームの表示/非表示を切り替える） */}
              {!isFormVisible && ( // フォームが非表示の場合のみ表示
                <View style={styles.addButtonWrapper}>
                  <Button
                    title="タスクを追加"
                    onPress={() => {
                      if (!currentChild) {
                        Alert.alert('エラー', '宿題を追加するには、こどもを選択してください。');
                        return;
                      }
                      setIsFormVisible(true);
                      setNewTaskType(activeTab); // 現在のタブのタイプをデフォルトに設定
                    }}
                    color="#007bff"
                  />
                </View>
              )}

              {/* 条件付きで表示される入力フォーム */}
              {isFormVisible && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>{editingTask ? 'タスク編集' : '新しいタスクを追加'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="タスク名"
                    value={newTaskName}
                    onChangeText={setNewTaskName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="説明（任意）"
                    value={newTaskDescription}
                    onChangeText={setNewTaskDescription}
                    multiline
                  />

                  {/* タスクタイプ選択 */}
                  <View style={styles.radioGroup}>
                      <TouchableOpacity
                          style={styles.radioButton}
                          onPress={() => setNewTaskType('daily')}
                      >
                          <View style={styles.radioCircle}>
                              {newTaskType === 'daily' && <View style={styles.selectedRadioCircle} />}
                          </View>
                          <Text style={styles.radioText}>日次タスク</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                          style={styles.radioButton}
                          onPress={() => setNewTaskType('deadline')}
                      >
                          <View style={styles.radioCircle}>
                              {newTaskType === 'deadline' && <View style={styles.selectedRadioCircle} />}
                          </View>
                          <Text style={styles.radioText}>期限付きタスク</Text>
                      </TouchableOpacity>
                  </View>

                  {/* 期限付きタスクの場合のみ日付ピッカーを表示 */}
                  {newTaskType === 'deadline' && (
                    <View style={styles.datePickerContainer}>
                      <Text style={styles.datePickerLabel}>期限日: {format(newDeadline, 'yyyy/MM/dd HH:mm')}</Text>
                      <Button title="期限日を選ぶ" onPress={() => setShowDatePicker(true)} />
                      {showDatePicker && (
                        <DateTimePicker
                          value={newDeadline}
                          mode="datetime"
                          display="default"
                          onChange={onDateChange}
                          minimumDate={new Date()} // 現在時刻以降に設定
                        />
                      )}
                    </View>
                  )}

                  <View style={styles.buttonGroup}>
                    <Button
                      title={editingTask ? 'タスクを更新' : 'タスクを追加'}
                      onPress={handleAddOrUpdateTask}
                    />
                    <Button
                      title="キャンセル"
                      onPress={resetForm}
                      color="#666"
                    />
                  </View>
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={styles.bottomButtonsContainer}>
                <Button title="メイン画面へ戻る" onPress={() => navigation.navigate('Main')} />
            </View>
          }
          style={styles.flatListMain}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={true}
          ListEmptyComponent={
              // FlatListのdataが空の場合に表示されるコンポーネント（ここでは既にListHeaderComponentで表示済みだが念のため）
              <View />
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  flatListMain: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  currentChildName: { // 現在選択中の子どもの名前表示
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  noChildSelected: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabContainer: { // タブボタンのコンテナ
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  tabButton: { // 各タブボタン
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTab: { // アクティブなタブ
    borderColor: '#007bff',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    alignSelf: 'flex-start',
    width: '100%',
  },
  noTaskText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButtonWrapper: {
    width: '100%',
    marginVertical: 20,
  },
  formContainer: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  radioGroup: { // ラジオボタンのグループ
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  radioButton: { // 各ラジオボタン
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: { // ラジオボタンの丸
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadioCircle: { // 選択されたラジオボタンの内部の丸
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
  },
  radioText: {
    fontSize: 16,
  },
  datePickerContainer: { // 日付ピッカーのコンテナ
      width: '100%',
      marginBottom: 15,
      alignItems: 'center',
  },
  datePickerLabel: {
      fontSize: 16,
      marginBottom: 10,
      fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  taskItem: { // 各タスクアイテム
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  taskDeadline: {
    fontSize: 14,
    color: '#dc3545', // 赤色で強調
    marginBottom: 5,
    fontWeight: 'bold',
  },
  taskStatus: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    flexWrap: 'wrap', // ボタンが多すぎるときに折り返す
  },
  taskButton: { // タスクアイテム内のボタン
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
    marginBottom: 5, // 折り返したときに隙間を空ける
  },
  editButton: {
    backgroundColor: '#ffc107', // オレンジ（編集）
  },
  deleteButton: {
    backgroundColor: '#dc3545', // 赤（削除）
  },
  completeButton: {
    backgroundColor: '#28a745', // 緑（完了）
  },
  revertButton: {
    backgroundColor: '#6c757d', // 灰色（未完了に戻す）
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  bottomButtonsContainer: { // 画面下部のボタン（メイン画面へ戻る）
    width: '100%',
    paddingVertical: 20,
    marginTop: 'auto', // これで一番下に押しやる
  },
});

export default HomeworkManagementScreen;