from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List
from pydantic import BaseModel
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache

# Load credentials from the file
SERVICE_ACCOUNT_FILE = './token.json'
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# Connect to the Calendar API
service = build('calendar', 'v3', credentials=credentials)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Event(BaseModel):
    name: str
    time_from: str
    time_to: str
    day: int


# Serve index.html for the root URL
@app.get("/")
async def read_root():
    index_path = "public/index.html"
    try:
        return FileResponse(index_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Index file not found")


@app.get("/events/{year}/{month}", response_model=List[Event])
@cache(expire=300)
async def get_events(year: int, month: int):
    try:
        start_of_month = datetime.datetime(year, month, 1)
        end_of_month = (datetime.datetime(year, month + 1, 1) if month != 12
                        else datetime.datetime(year + 1, 1, 1))

        # Convert to RFC3339 format
        start_of_month_str = start_of_month.isoformat() + 'Z'
        end_of_month_str = end_of_month.isoformat() + 'Z'

        calendar_id = '753f56b472c173b0c7e85f01b41d5ec1776e0441294a2b3b2744847c8e1b350d@group.calendar.google.com'

        # Get the events
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=start_of_month_str,
            timeMax=end_of_month_str,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])

        if not events:
            return []

        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))

            # Parse the date and time
            start_datetime = datetime.datetime.fromisoformat(start.replace('Z', '+00:00'))
            end_datetime = datetime.datetime.fromisoformat(end.replace('Z', '+00:00'))

            current_datetime = start_datetime
            while current_datetime.date() <= end_datetime.date():
                event_day = current_datetime.date()
                time_from = current_datetime.strftime('%H:%M')
                if event_day == end_datetime.date():
                    time_to = end_datetime.strftime('%H:%M')
                else:
                    time_to = "23:59"

                formatted_event = Event(
                    name=event.get('summary', 'No Title'),
                    time_from=time_from,
                    time_to=time_to,
                    day=event_day.day
                )
                formatted_events.append(formatted_event)

                # Move to the next day
                current_datetime = datetime.datetime.combine(event_day + datetime.timedelta(days=1),
                                                             datetime.time(0, 0))

        return formatted_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Static files
app.mount("/public", StaticFiles(directory="public"), name="public")

if __name__ == "__main__":
    import uvicorn

    FastAPICache.init(InMemoryBackend())
    uvicorn.run(app, host="0.0.0.0", port=8000)
