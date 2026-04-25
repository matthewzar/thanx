User.find_or_create_by!(email: "demo@example.com") do |u|
  u.name           = "Demo User"
  u.points_balance = 1_500
end

[
  { name: "Free Coffee",         description: "Any coffee on us",               cost:   200, category: "Coffee",     stock:  50,  active: true  },
  { name: "Coffee Size Upgrade", description: "Upgrade any drink to next size", cost:   100, category: "Coffee",     stock:  nil, active: true  },
  { name: "Free Pastry",         description: "One free pastry item",           cost:   300, category: "Food",       stock:  25,  active: true  },
  { name: "Free Lunch Sandwich", description: "One free sandwich",              cost:   800, category: "Food",       stock:    0, active: true  },
  { name: "$5 Gift Card",        description: "$5 off your next purchase",      cost:   500, category: "Gift Cards", stock:  20,  active: true  },
  { name: "$10 Gift Card",       description: "$10 off your next purchase",     cost:   900, category: "Gift Cards", stock:  15,  active: true  },
  { name: "Mystery Box",         description: "A surprise reward box",          cost: 1_000, category: "Special",    stock:   5,  active: true  },
  { name: "Loyalty Badge",       description: "Digital loyalty collectible",    cost:   150, category: "Special",    stock:  nil, active: false }
].each do |attrs|
  Reward.find_or_create_by!(name: attrs[:name]) { |r| r.assign_attributes(attrs.except(:name)) }
end
