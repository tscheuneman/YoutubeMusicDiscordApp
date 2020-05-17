# Youtube Discord Bot

A discord bot that enters the requesters voice channel and plays music from YouTube.

## Prerequisites:
**Node**: 14.2.0 (As tested)
**@discordjs/opus***: May need build-essential on Ubuntu
**ffmpeg**

## To Use:
#### ENV
The Bot Token of the discord app needs to be filled out in the .env file.  An example.env has been created to describe how that should be done.  The activator word can also be set there.  It defaults to `!music`

#### Methods
`!music <song_name>`: Searches youtube for a given phrase, plays audio from first result.

`!music help`: Shows all possible actions

`!music queue`: Shows the queue

`!music stop`: Stops the bot and exits it from the voice channel

`!music next | skip`: Goes to the next song

`!music pause`: Pauses the music

`!music resume`: Resume's the music

`!music queue delete [start-end]`: Remove elements from the queue. *start* and *end* should be numbers


## To-Dos:
