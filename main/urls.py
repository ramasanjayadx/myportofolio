from django.urls import path

from main.views import (
    create_experience,
    create_project,
    delete_experience,
    delete_project,
    edit_experience,
    get_experiences_json,
    get_projects_json,
    show_experience,
    show_main,
    show_project,
    register,
    login_user,
    logout_user,
    toggle_star,
    toggle_experience_star,
    create_project_ajax,
)

app_name = "main"

urlpatterns = [
    path("", show_main, name="show_main"),
    path("experience/", show_experience, name="show_experience"),
    path("experience/add/", create_experience, name="create_experience"),
    path("experience/<uuid:experience_id>/edit/", edit_experience, name="edit_experience"),
    path("experience/<uuid:experience_id>/delete/", delete_experience, name="delete_experience"),
    path("api/experiences/", get_experiences_json, name="get_experiences_json"),
    path("project/", show_project, name="show_project"),
    path("project/add/", create_project, name="create_project"),
    path("api/projects/", get_projects_json, name="get_projects_json"),
    path("projects/<uuid:project_id>/delete/", delete_project, name="delete_project"),
    path("register/", register, name="register"),
    path("login/", login_user, name="login"),
    path("logout/", logout_user, name="logout"),
    path("projects/<uuid:project_id>/star/", toggle_star, name="toggle_star"),
    path("experience/<uuid:experience_id>/star/", toggle_experience_star, name="toggle_experience_star"),
    path("projects/add-ajax/", create_project_ajax, name="create_project_ajax"),
]