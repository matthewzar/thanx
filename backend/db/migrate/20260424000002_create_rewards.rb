class CreateRewards < ActiveRecord::Migration[8.0]
  def change
    create_table :rewards do |t|
      t.string  :name,        null: false
      t.text    :description
      t.integer :cost,        null: false
      t.string  :category,    null: false
      t.integer :stock
      t.boolean :active,      null: false, default: true
      t.timestamps
    end

    add_index :rewards, :category
    add_index :rewards, %i[active cost]
    add_check_constraint :rewards, "cost > 0", name: "rewards_cost_positive"
    add_check_constraint :rewards, "stock >= 0 OR stock IS NULL",
                         name: "rewards_stock_non_negative"
  end
end
