class StepsController < ApplicationController
  before_action :set_card
  before_action :set_step, only: [:update, :destroy]

  def create
    @step = @card.steps.new(step_params)
    if @step.save
      render json: @step, status: :created
    else
      render json: { errors: @step.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @step.update(step_params)
      render json: @step
    else
      render json: { errors: @step.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @step.destroy
    head :no_content
  end

  private

  def set_card
    project = Project.find(params[:project_id])
    @card = project.cards.find(params[:card_id])
  end

  def set_step
    @step = @card.steps.find(params[:id])
  end

  def step_params
    params.require(:step).permit(:title, :completed, :position)
  end
end
