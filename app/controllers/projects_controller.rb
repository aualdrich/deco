class ProjectsController < ApplicationController
  before_action :set_project, only: [:show, :board, :update, :destroy]

  def index
    @projects = Project.all.order(:name)
    respond_to do |format|
      format.html # renders app/views/projects/index.html.erb
      format.json { render json: @projects }
    end
  end

  def show
  end

  def board
  end

  def create
    @project = Project.new(project_params)
    if @project.save
      render json: @project, status: :created
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @project.update(project_params)
      render json: @project
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    head :no_content
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :directory, :agent_name)
  end
end
