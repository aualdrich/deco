class CreateSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :steps do |t|
      t.string :title, null: false
      t.boolean :completed, null: false, default: false
      t.integer :position, null: false, default: 0
      t.integer :card_id, null: false

      t.timestamps
    end

    add_index :steps, :card_id
  end
end
