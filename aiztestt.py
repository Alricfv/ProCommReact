import tkinter
import customtkinter
from tkinter import filedialog
from PIL import Image
import sounddevice as sd
from scipy.io.wavfile import write
import pygame
import os
import parselmouth
pygame.mixer.init()

customtkinter.set_appearance_mode("Dark")
customtkinter.set_default_color_theme("dark-blue")

import re

def format_analysis_output(text):
    # Remove all curly brackets
    text = re.sub(r'[{}]', '', text)

    # Add line spacing between each statistic
    formatted_text = re.sub(r'(\S)\n(\S)', r'\1\n\n\2', text)  # Adds extra line between non-space lines
    
    # Return formatted text
    return formatted_text

def filter_input():
    # List of disallowed characters
    disallowed_chars = {'{'}

    # Check if the pressed key is in the disallowed characters
    if event.char in disallowed_chars:
        # Prevent the character from being inserted
        return "break"  # Return "break" to cancel the event
    
def Analysis1():
    mysp = __import__("my-voice-analysis")
    p = "outp"  # audio File title
    c = r"C:\Users\alric\Documents\work\Ultimate\Appfiles"  # Path to the Audio_File directory
    mysp.myspsr(p, c)
    mysp.mysppaus(p, c)
    mysp.myspsyl(p, c)
    mysp.myspst(p, c)
    mysp.myspod(p, c)
    mysp.myspbala(p, c)
    mysp.mysppron(p, c)
    mysp.myspgend(p, c)

# Define the Record1 function
def Record1(duration):
    fs = 44100  # Sample rate
    myrecording = sd.rec(int(duration * fs), samplerate=fs, channels=2)
    sd.wait()  # Wait until recording is finished
    
    # Change the output filename if it already exists
    filename = 'outp.wav'
    if os.path.exists(filename):
        os.remove(filename)  # Remove the existing file

    write(filename, fs, myrecording)

# Placeholder for transcription
def transcribing():
         import whisper

         model = whisper.load_model("tiny")
         result = model.transcribe("outp.wav")
         f=open('transcrib.txt','w')
         print(result["text"],file=f)
         f.close()

# Main App Class
class App(customtkinter.CTk):
    def __init__(self):
        super().__init__()

        self.record_duration = 20
        self.transcription_model = "tiny"

        # Configure window
        self.title("ProComm.py")
        self.geometry(f"{1200}x600")
        self.configure(fg_color='#000000')
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar_frame = customtkinter.CTkFrame(self, width=200, corner_radius=0, fg_color="#909090")
        self.sidebar_frame.grid(row=0, column=0, rowspan=8, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(8, weight=1)

        # Sidebar Elements
        self.logo_label = customtkinter.CTkLabel(self.sidebar_frame, text="ProComm", text_color='black',
                                                 font=customtkinter.CTkFont('Product Sans', size=30, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(40, 20))

        # Placeholder Image
        my_image = customtkinter.CTkImage(light_image=Image.open('igotchucps.PNG'),
                                          dark_image=Image.open('igotchucps.PNG'),
                                          size=(150,150))
        my_label = customtkinter.CTkButton(self, text="", image=my_image)
        my_label.grid(row=0, column=0, padx=20, pady=(1,1))

        # Settings Icon
        my_image1 = customtkinter.CTkImage(light_image=Image.open('settingicon.PNG'),
                                          dark_image=Image.open('settingicon.PNG'),
                                          size=(40,40))
        self.settings_button = customtkinter.CTkButton(self.sidebar_frame, text="", width=10, height=10, image=my_image1,
                                                       fg_color='#909090', command=self.open_toplevel)
        self.settings_button.grid(row=10, column=0, padx=20, pady=(10, 10))

        # Textboxes for output display
        self.textbox = customtkinter.CTkTextbox(self, font=('Product Sans', 16), fg_color='#212121', wrap='word', width=300, height=300)
        self.textbox.grid(row=0, column=3, padx=(20, 20), pady=(20, 20), sticky="nsew")

        self.textbox2 = customtkinter.CTkTextbox(self, font=('Product Sans', 16), fg_color='#212121', wrap='word', width=300, height=300)
        self.textbox2.grid(row=0, column=1, padx=(20, 20), pady=(20, 20), sticky="nsew")
        self.textbox2.bind("<Key>", self.filter_input)

        # Footer Label
        self.lbl = customtkinter.CTkLabel(self, font=('Product Sans', 13), text_color='white',
                                          text="ProComm is an all-in-one communication skills development tool. Available to members only.")
        self.lbl.grid(row=1, column=1, columnspan=3, padx=(20,0), pady=(20,0))

        # Create TabView for options
        self.tabview = customtkinter.CTkTabview(self, width=350)
        self.tabview.grid(row=0, column=2, padx=(20, 20), pady=(20, 20), sticky="nsew")
        self.tabview.add("Audio Booth")
        self.tabview.tab("Audio Booth").grid_columnconfigure(0, weight=1)

        # Record Button
        self.string_input_button = customtkinter.CTkButton(self.tabview.tab("Audio Booth"), width=150, height=75,
                                                           text="Record", font=('Product Sans',16),
                                                           command=self.record_action)
        self.string_input_button.grid(row=1, column=0, padx=20, pady=(10, 10))

        # Play Button
        self.play_button = customtkinter.CTkButton(self.tabview.tab("Audio Booth"), width=150, height=75,
                                                   text="Play Recording", font=('Product Sans', 16),
                                                   command=self.play_recording)
        self.play_button.grid(row=2, column=0, padx=20, pady=(10, 10))

        # Analyze Button
        self.string_input_button2 = customtkinter.CTkButton(self.tabview.tab("Audio Booth"), width=150, height=75,
                                                            text="Analyse", font=('Product Sans',16),
                                                            command=self.insert_analysis_output)
        self.string_input_button2.grid(row=3, column=0, padx=20, pady=(10, 10))

        # Speech To Text Button
        self.string_input_button3 = customtkinter.CTkButton(self.tabview.tab("Audio Booth"), width=150, height=75,
                                                            text="Speech To Text", font=('Product Sans',16),
                                                            command=self.insert_analysis_output2)
        self.string_input_button3.grid(row=4, column=0, padx=20, pady=(10, 10))

        # Insert placeholders in text boxes
        self.textbox.insert("1.0", "                 Transcription Box")
        self.textbox2.insert("1.0", "              Speech Analysis Box")

    def open_toplevel(self):
        top = customtkinter.CTkToplevel(self)
        top.title("Settings")
        top.geometry("400x300")
        top.configure(fg_color='#212121')
        top.attributes("-topmost", True)

        # Frame inside Toplevel
        frame = customtkinter.CTkFrame(top, width=400, height=300, corner_radius=10, fg_color='#333333')
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Settings for duration and model
        duration_label = customtkinter.CTkLabel(frame, text="Speech Recording Duration (seconds):", text_color='white', font=customtkinter.CTkFont('Product Sans', 14))
        duration_label.pack(pady=(20, 5))
        self.duration_entry = customtkinter.CTkEntry(frame, placeholder_text="Enter duration in seconds", width=300)
        self.duration_entry.pack(pady=(0, 20))

        model_label = customtkinter.CTkLabel(frame, text="Transcription Model:", text_color='white', font=customtkinter.CTkFont('Product Sans', 14))
        model_label.pack(pady=(10, 5))
        self.model_entry = customtkinter.CTkEntry(frame, placeholder_text="Enter model name (e.g., tiny)", width=300)
        self.model_entry.pack(pady=(0, 20))

        apply_button = customtkinter.CTkButton(frame, text="Apply Changes", command=self.apply_changes, width=120)
        apply_button.pack(pady=10)

        close_button = customtkinter.CTkButton(frame, text="Close", command=top.destroy, width=120)
        close_button.pack(pady=10)

    def apply_changes(self):
        try:
            self.record_duration = int(self.duration_entry.get())
        except ValueError:
            print("Invalid duration input. Using default value of 20 seconds.")
            self.record_duration = 20
        self.transcription_model = self.model_entry.get() or "tiny"
        print(f"Speech Recording Duration: {self.record_duration} seconds")
        print(f"Transcription Model: {self.transcription_model}")

    def record_action(self):
        self.string_input_button.configure(text="Recording...", fg_color='#FF8000')
        self.update_idletasks()
        Record1(self.record_duration)
        self.string_input_button.configure(text="Record", fg_color='#0078D4')

    def play_recording(self):
        self.play_button.configure(text="Playing...", fg_color='#FF8000')
        self.update_idletasks()
        try:
            pygame.mixer.music.load("outp.wav")
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                self.update()
        except pygame.error as e:
            print(f"Error playing sound: {e}")
        self.play_button.configure(text="Play Recording", fg_color='#0078D4')

    def filter_input(self, event):
        if event.char in {'{'}:
            return "break"

    def insert_analysis_output(self):
    
    # Run the analysis
        Analysis1()

    # Read the analysis files and format their content
        files = ['myspsr.txt', 'mysppaus.txt', 'myspsyl.txt', 'myspst.txt', 'myspod.txt', 'myspbala.txt', 'mysppron.txt', 'myspgend.txt']
        formatted_text = ""

        for file in files:
            with open(file, 'r') as f:
                content = f.read()
                formatted_content = format_analysis_output(content)
                formatted_text += formatted_content + "\n\n"  # Add double line spacing between file contents

    # Define the title
        title = "Speech Analysis Results\n\n"  # Title with additional line spacing

    # Clear existing content in textbox2 and insert the title followed by formatted content
        self.textbox2.delete("0.0", tkinter.END)
        self.textbox2.insert("0.0", title + formatted_text)




    def insert_analysis_output2(self):
        self.string_input_button3.configure(text="Transcribing...", fg_color='#FF8000')

        self.update_idletasks()
        
        transcribing()
        file=open('transcrib.txt','r',encoding="utf-8")
        f=file
        read=file.readlines()
        self.textbox.delete("0.0", tkinter.END)
        self.textbox.insert("0.0", read)
        f.close()

        self.string_input_button3.configure(text="Speech To Text", fg_color='#0078D4')

if __name__ == "__main__":
    app = App()
    app.mainloop()



