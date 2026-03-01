class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name, null: false
      t.string :directory
      t.string :agent_name

      t.timestamps
    end
  end
end
