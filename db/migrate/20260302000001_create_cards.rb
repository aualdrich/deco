class CreateCards < ActiveRecord::Migration[8.1]
  def change
    create_table :cards do |t|
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "todo"
      t.integer :position, null: false, default: 0
      t.integer :project_id, null: false

      t.timestamps
    end

    add_index :cards, :project_id
  end
end
