# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_04_24_000003) do
  create_table "redemptions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "reward_id", null: false
    t.integer "points_spent", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reward_id"], name: "index_redemptions_on_reward_id"
    t.index ["user_id", "created_at"], name: "index_redemptions_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_redemptions_on_user_id"
    t.check_constraint "points_spent > 0", name: "redemptions_points_spent_positive"
  end

  create_table "rewards", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.integer "cost", null: false
    t.string "category", null: false
    t.integer "stock"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active", "cost"], name: "index_rewards_on_active_and_cost"
    t.index ["category"], name: "index_rewards_on_category"
    t.check_constraint "cost > 0", name: "rewards_cost_positive"
    t.check_constraint "stock >= 0 OR stock IS NULL", name: "rewards_stock_non_negative"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "name", null: false
    t.integer "points_balance", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.check_constraint "points_balance >= 0", name: "users_points_balance_non_negative"
  end

  add_foreign_key "redemptions", "rewards"
  add_foreign_key "redemptions", "users"
end
