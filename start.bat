@echo off
title Futuristic MP3 Player
cd /d "%~dp0..\..\scratch\mp3-player"
start "" "http://localhost:3000"
npx.cmd -y serve -l 3000 .
