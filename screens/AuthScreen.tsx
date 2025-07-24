// screens/AuthScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { registerUser, loginUser } from '../auth';

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 確認用パスワードのstate
  const [isRegistering, setIsRegistering] = useState(false); // 登録モードかログインモードか
  const [loading, setLoading] = useState(false); // 処理中を示すローディング状態

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegistering) {
        // 登録時のパスワード一致チェック
        if (password !== confirmPassword) {
          Alert.alert('エラー', 'パスワードと確認用パスワードが一致しません。');
          setLoading(false);
          return;
        }
        await registerUser(email, password);
        Alert.alert('登録完了', 'アカウントが作成されました。');
      } else {
        await loginUser(email, password);
        Alert.alert('ログイン成功', 'メイン画面へ移動します。');
        // ログイン成功後は、App.tsx の onAuthStateChanged がメイン画面への遷移を処理します
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message || '認証に失敗しました。');
    } finally {
      setLoading(false);
      // 認証試行後にパスワード入力欄をクリアする（セキュリティとUXのため）
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'アカウント登録' : 'ログイン'}</Text>
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {isRegistering && ( // 登録モードの場合のみ確認用パスワードを表示
        <TextInput
          style={styles.input}
          placeholder="パスワード（確認用）"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button title={isRegistering ? '登録' : 'ログイン'} onPress={handleAuth} />
          <View style={{ height: 20 }} />
          <Button
            title={isRegistering ? 'ログイン画面へ' : 'アカウント登録画面へ'}
            onPress={() => {
                setIsRegistering(!isRegistering);
                // モード切り替え時にフォームをリセット
                setEmail('');
                setPassword('');
                setConfirmPassword('');
            }}
            color="#666"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '80%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
});

export default AuthScreen;