# Allow the Vite dev server (localhost:5173) to call the API during local development.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173"

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end
