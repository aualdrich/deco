class AddChatMessagesToCards < ActiveRecord::Migration[8.1]
  def change
    # SQLite doesn't have a native JSON column type; we store JSON in TEXT.
    # Default to an empty array to avoid nil surprises.
    add_column :cards, :chat_messages, :text, null: false, default: "[]"
  end
end
