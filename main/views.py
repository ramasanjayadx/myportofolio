from django.shortcuts import render
# Create your views here.

from main.models import Experience, Project

def show_main(request):
    context = {
        "name": "Rama Sanjaya",
        "npm": "2506604421",
        "study_program": "S1 Ilmu Komputer",
        "bio": (
            "Mahasiswa Ilmu Komputer Universitas Indonesia yang tertarik "
            "pada pengembangan perangkat lunak dan pendidikan."
        ),
    }
    return render(request, "index.html", context)


def show_experience(request):
    context = {
        "name": "Rama Sanjaya",
        "experience_list": Experience.objects.all(),
    }
    return render(request, "experience.html", context)

def show_project(request):
    context = {
        "name": "Rama Sanjaya",
        "project_list": Project.objects.all(),
    }
    return render(request, "project.html", context)