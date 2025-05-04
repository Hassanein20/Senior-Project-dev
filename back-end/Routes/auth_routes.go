package routes

import (
	controllers "HabitBite/backend/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine, authController *controllers.AuthController) {
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", authController.Register)
		authGroup.POST("/login", authController.Login)
	}
}
