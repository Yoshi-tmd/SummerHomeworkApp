// こどもプロフィールの「型」を定義
export interface ChildProfile {
  id: string; // こどもを識別するための一意のID
  name: string; // こどもの名前
  age?: number;
  grade?: string;
}

// タスクの種類
export type TaskType = 'daily' | 'deadline';

// タスクの進捗状態
export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';

// 基本的なタスクのインターフェース
export interface Task {
  id: string;
  name: string;
  description?: string; // 説明を追加（任意）
  type: TaskType;
  status: TaskStatus;
  createdAt: string; // 作成日時 (ISO文字列)
  updatedAt: string; // 更新日時 (ISO文字列)
}

// 日次タスクのインターフェース（Taskを拡張）
export interface DailyTask extends Task {
  // daily タスクに固有のプロパティがあればここに追加
  // 例えば、何曜日にやるかなど
}

// 期限付きタスクのインターフェース（Taskを拡張）
export interface DeadlineTask extends Task {
  deadline: string; // 期限 (ISO文字列)
  // deadline タスクに固有のプロパティがあればここに追加
}

// タスクをまとめた型（全てのタスクを保持する際に便利）
export interface AllTasks {
  dailyTasks: DailyTask[];
  deadlineTasks: DeadlineTask[];
}