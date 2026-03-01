require 'rails_helper'

RSpec.describe Project, type: :model do
  describe 'validations' do
    it 'is valid with a name' do
      expect(Project.new(name: 'Test Project')).to be_valid
    end

    it 'is invalid without a name' do
      project = Project.new(name: nil)
      expect(project).not_to be_valid
      expect(project.errors[:name]).to include("can't be blank")
    end

    it 'allows blank directory and agent_name' do
      expect(Project.new(name: 'Test', directory: nil, agent_name: nil)).to be_valid
    end
  end
end
