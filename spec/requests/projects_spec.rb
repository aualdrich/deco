require 'rails_helper'

RSpec.describe 'Projects', type: :request do
  describe 'GET /projects/:id' do
    it 'returns http success (HTML)' do
      project = Project.create!(name: 'Test Project')

      get "/projects/#{project.id}"

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /projects' do
    it 'returns 200 with a JSON array' do
      Project.create!(name: 'Alpha')
      Project.create!(name: 'Beta')

      get '/projects', as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to be_an(Array)
      expect(body.map { |p| p['name'] }).to include('Alpha', 'Beta')
    end
  end

  describe 'POST /projects' do
    it 'returns 201 with project JSON when params are valid' do
      post '/projects', params: { project: { name: 'New Project', directory: '/tmp', agent_name: 'Agent' } }, as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['id']).to be_present
      expect(body['name']).to eq('New Project')
      expect(body['directory']).to eq('/tmp')
      expect(body['agent_name']).to eq('Agent')
    end

    it 'returns 422 with errors JSON when name is missing' do
      post '/projects', params: { project: { name: nil } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body['errors']).to include("Name can't be blank")
    end
  end

  describe 'PATCH /projects/:id' do
    it 'returns 200 with updated project JSON when params are valid' do
      project = Project.create!(name: 'Old Name')

      patch "/projects/#{project.id}", params: { project: { name: 'Updated Name' } }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['id']).to eq(project.id)
      expect(body['name']).to eq('Updated Name')
    end

    it 'returns 422 with errors JSON when name is missing' do
      project = Project.create!(name: 'Valid Name')

      patch "/projects/#{project.id}", params: { project: { name: nil } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body['errors']).to include("Name can't be blank")
    end
  end

  describe 'DELETE /projects/:id' do
    it 'returns 204' do
      project = Project.create!(name: 'To Delete')

      delete "/projects/#{project.id}", as: :json

      expect(response).to have_http_status(:no_content)
      expect(Project.exists?(project.id)).to be(false)
    end
  end
end
