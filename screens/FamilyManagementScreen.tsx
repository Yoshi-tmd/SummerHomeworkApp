// screens/FamilyManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue, set, remove } from 'firebase/database';
import 'react-native-get-random-values'; // UUID生成のためのポリフィル
import { v4 as uuidv4 } from 'uuid'; // ユニークID生成ライブラリ
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildProfile } from '../types';


function FamilyManagementScreen({ navigation, userId }: any) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [newChildName, setNewChildName] = useState('');
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);    // 入力フォームの表示状態を管理するstate



  // Firebaseから子どもデータを読み込む
  useEffect(() => {
    if (!userId) return;

    const childrenRef = ref(database, `users/${userId}/children`);
    const unsubscribe = onValue(childrenRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedChildren: ChildProfile[] = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          age: data[key].age,
          grade: data[key].grade,
        }));
        setChildren(loadedChildren);
      } else {
        setChildren([]); // データがない場合は空の配列
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // 子どもを追加または更新する
  const handleAddOrUpdateChild = async () => {
    if (newChildName.trim() === '') {
      Alert.alert('エラー', 'こどもの名前を入力してください。');
      return;
    }

    try {
      if (editingChild) {
        // 更新処理
        const childRef = ref(database, `users/${userId}/children/${editingChild.id}`);

        const updateData: { name: string; age?: number; grade?: string | null } = {
            name: newChildName,
        };
        // ageが存在する場合のみ追加
        if (editingChild.age !== undefined) {
            updateData.age = editingChild.age;
        } else {
            // age が undefined の場合、明示的に null を設定して Firebase から削除（または存在しないことを示す）
            // この場合、age フィールドをFirebaseから削除したい場合は remove() を使うか、merge update を検討しますが、
            // 簡単のため、undefined の場合は含めない（または null にする）方針で行きます。
            // 現状のsetは上書きなので、undefinedが含まれないようにすればOKです。
            // むしろ、年齢・学年を管理画面で入力できるように変更する必要があるかもしれません。
            // 今回は、現在の editingChild の値（undefinedの可能性あり）をそのまま渡さないようにします。
        }

        // `editingChild` はFirebaseから読み込まれたオブジェクトで、`age` や `grade` プロパティが
        // もともと存在しなければ `undefined` になります。
        // ここでは、編集時に年齢や学年を入力するUIがないため、それらのプロパティが更新時に
        // `undefined` のままにならないように、フィルタリングして渡します。

        // 元の `editingChild` から名前以外のプロパティを引き継ぎつつ、更新する
        const updatedChildData = {
            name: newChildName,
            ...(editingChild.age !== undefined && { age: editingChild.age }), // ageがundefinedでなければ含める
            ...(editingChild.grade !== undefined && { grade: editingChild.grade }), // gradeがundefinedでなければ含める
            // 必要に応じて他のプロパティも同様に処理
        };

        await set(childRef, updatedChildData); // 修正してオブジェクトを渡す
        Alert.alert('成功', 'こどもの情報を更新しました。');
        setEditingChild(null);
      } else {
        // 追加処理
        const newId = uuidv4(); // 新しいユニークIDを生成
        const childRef = ref(database, `users/${userId}/children/${newId}`);
        await set(childRef, { id: newId, name: newChildName }); // idも保存する
        Alert.alert('成功', '新しいこどもを追加しました。');
      }
      setNewChildName(''); // 入力フィールドをクリア
      setIsFormVisible(false);
    } catch (error: any) {
      Alert.alert('エラー', '処理中に問題が発生しました: ' + error.message);
      console.error('Error adding/updating child:', error);
    }
  };

  // 編集モードにする
  const startEditing = (child: ChildProfile) => {
    setEditingChild(child);
    setNewChildName(child.name);
    setIsFormVisible(true); // フォームを表示
  };

  // フォームをリセットして閉じる
  const cancelForm = () => {
    setEditingChild(null);
    setNewChildName('');
    setIsFormVisible(false);
  };

  // 子どもを削除する
  const handleDeleteChild = async (childId: string) => {
    Alert.alert(
      '確認',
      'このこどもを削除しますか？関連する全ての宿題データも削除されます。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          onPress: async () => {
            try {
              const childRef = ref(database, `users/${userId}/children/${childId}`);
              await remove(childRef);
              Alert.alert('削除完了', 'こどもの情報が削除されました。');
              // 削除した子が現在選択中の子だった場合、選択を解除
              // App.tsxのロジックで自動的に調整されるか、ここで別途対応が必要
            } catch (error: any) {
              Alert.alert('エラー', '削除中に問題が発生しました: ' + error.message);
              console.error('Error deleting child:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"} // iOSはpadding、Androidはheightが適切
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // 必要に応じてオフセットを調整
        >
          {/* FlatList が画面全体のスクロールを担当するため、ScrollView は削除します */}
            <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={styles.childItem}>
                <Text style={styles.childName}>{item.name}</Text>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => startEditing(item)} style={[styles.button, styles.editButton]}>
                    <Text style={styles.buttonText}>編集</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteChild(item.id)} style={[styles.button, styles.deleteButton]}>
                    <Text style={styles.buttonText}>削除</Text>
                    </TouchableOpacity>
                </View>
                </View>
            )}
            // ★ListHeaderComponent と ListFooterComponent を利用
            ListHeaderComponent={
                <View style={styles.headerContainer}>
                <Text style={styles.title}>家族・子ども管理</Text>
                <Text style={styles.subtitle}>登録済みの子ども</Text>
                {children.length === 0 && (
                    <Text style={styles.noChildText}>まだこどもが登録されていません。「子どもを追加」ボタンから追加してください。</Text>
                )}
                {/* 「子どもを追加」ボタン（フォームの表示/非表示を切り替える） */}
                {!isFormVisible && (
                    <View style={styles.addButtonWrapper}>
                    <Button
                        title="子どもを追加"
                        onPress={() => setIsFormVisible(true)}
                        color="#007bff"
                    />
                    </View>
                )}
                {/* 条件付きで表示される入力フォーム */}
                {isFormVisible && (
                    <View style={styles.formContainer}>
                      <Text style={styles.formTitle}>{editingChild ? 'こどもの情報編集' : '新しいこどもを追加'}</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="こどもの名前"
                          value={newChildName}
                          onChangeText={setNewChildName}
                      />
                      <View style={styles.buttonGroup}>
                          <Button
                          title={editingChild ? 'こどもを更新' : 'こどもを追加'}
                          onPress={handleAddOrUpdateChild}
                          />
                          <Button
                          title="キャンセル"
                          onPress={cancelForm}
                          color="#666"
                          />
                      </View>
                    </View>
                )}
                </View>
            }
            ListFooterComponent={
                // メイン画面へ戻るボタン
                <View style={styles.bottomButtonContainer}>
                    <Button
                        title="メイン画面へ戻る"
                        onPress={() => navigation.navigate('Main')}
                    />
                </View>
            }
            style={styles.flatListMain} // FlatList自体が画面全体を占めるスタイル
            contentContainerStyle={styles.flatListContent} // FlatListの内部コンテンツのスタイル
            scrollEnabled={true} // 明示的にスクロールを許可
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
    keyboardAvoidingContainer: { // KeyboardAvoidingViewのスタイル
        flex: 1, // これもflex:1を持たせて全体を埋める
    },
    headerContainer: {
        width: '100%', // FlatListの幅に合わせて調整
        alignItems: 'center',
        paddingHorizontal: 0, // FlatListのpaddingHorizontalで制御される
        paddingTop: Platform.OS === 'android' ? 20 : 0, // Androidの場合のみ上部にパディング
        // ここで下部パディングは不要（FlatListContentで調整）
    },
    scrollViewContent: { // ScrollViewのコンテンツコンテナスタイル
        // flexGrow: 1, // コンテンツが少ない場合でもScrollViewが領域を埋める
        // alignItems: 'center',
        // paddingHorizontal: 10,
        // paddingTop: Platform.OS === 'android' ? 20 : 0,
        // paddingBottom: 10, // 下部にもパディング
    },
    container: {    // このスタイルはもう使わない（またはScrollViewContentにマージ）
        // flex: 1,
        // backgroundColor: '#fff',
        // alignItems: 'center',
        // paddingHorizontal: 10,
        // paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20, // 以前の30から調整
        marginBottom: 15,
        // alignSelf: 'flex-start', // 左寄せ
        width: '100%',
    },
    noChildText: { // 子どもがいない場合のテキストスタイル
        fontSize: 16,
        color: '#888',
        marginBottom: 20,
        textAlign: 'center',
    },
    addButtonWrapper: { // 子どもを追加ボタンのコンテナ
        width: '60%',
        marginVertical: 20,
    },
    formContainer: { // 入力フォームのコンテナスタイル
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginBottom: 20, // フォームと下のボタンの間にスペース
    },
    formTitle: { // フォーム内のタイトル
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
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        // marginBottom: 15,
    },
    childItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    childName: {
        fontSize: 18,
        flex: 1,
    },
    buttonsContainer: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50', // 緑
    },
    deleteButton: {
        backgroundColor: '#f44336', // 赤
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
    },
    flatListMain: { // FlatList自身が画面全体を埋めるためのスタイル
        flex: 1,
        width: '100%',
        paddingHorizontal: 20, // コンテナにあった左右のパディングをFlatListに移動
    },
    // flatList: {
    //     width: '100%',
    //     marginBottom: 20, // ボタンとの間にスペース
    // },
    flatListContent: {
        flexGrow: 1, // コンテンツが少ない場合でもリストが領域を埋める
        // paddingBottom はListFooterComponentが担当するため、ここでは調整不要、あるいはFlatListMainのpaddingBottomで調整
        paddingBottom: 20, // 全体の最下部パディング
    },
    bottomButtonContainer: {
        width: '100%',
        paddingBottom: 0, // 下部パディング
        marginTop: 20, // これで一番下に押しやる
    }
});

export default FamilyManagementScreen;