class CardsController < ApplicationController
  before_action :set_project
  before_action :set_card, only: [:update]

  def index
    @cards = @project.cards
    render json: @cards
  end

  def create
    @card = @project.cards.new(card_params)
    if @card.save
      render json: @card, status: :created
    else
      render json: { errors: @card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @card.update(card_params)
      render json: @card
    else
      render json: { errors: @card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_card
    @card = @project.cards.find(params[:id])
  end

  def card_params
    params.require(:card).permit(:title, :description, :status, :position)
  end
end
