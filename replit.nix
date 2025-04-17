{pkgs}: {
  deps = [
    pkgs.ffmpeg-full
    pkgs.haskellPackages.bindings-portaudio
    pkgs.ocamlPackages.portaudio
    pkgs.xsimd
    pkgs.portmidi
    pkgs.pkg-config
    pkgs.libpng
    pkgs.libjpeg
    pkgs.freetype
    pkgs.fontconfig
    pkgs.SDL2_ttf
    pkgs.SDL2_mixer
    pkgs.SDL2_image
    pkgs.SDL2
    pkgs.libxcrypt
    pkgs.portaudio
    pkgs.alsa-lib
    pkgs.alsa-utils
    pkgs.pulseaudio
  ];
}
