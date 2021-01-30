#version 330 core

layout(location = 0) in vec3 pos;

out mat4 c_perspective;
out mat4 c_view;
out vec3 c_pos;

uniform mat4 perspective;
uniform mat4 view;
uniform vec3 cameraPos;

void main(){
    gl_Position = vec4(pos,1);
    c_perspective = perspective;
    c_view = view;
    c_pos = cameraPos;
}
