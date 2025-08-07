S3 File Explorer with XLS Modification
A full-stack web application designed to provide a secure and user-friendly interface for uploading, Browse, downloading, and modifying Excel (XLS/XLSX) files using a React frontend, a Django REST backend, and a MinIO S3-compatible object storage.

Key Features 🚀
Secure User Authentication: Complete user registration and login system using Django's token-based authentication.

File Upload: Upload XLS and XLSX files directly from the browser to a secure, S3-compatible MinIO bucket.

File Management: View a list of all your uploaded files, with options to download them directly to your system.

In-Browser File Modification: A key feature that allows users to perform basic edits on their Excel files (like adding/deleting columns or updating cells) directly from the web interface. The backend uses the Pandas library to handle these modifications.

Technology Stack ⚙️
Component Technology
Frontend React.js, Axios, Tailwind CSS
Backend Python, Django, Django REST Framework, Pandas
Database MySQL
Storage MinIO (S3-Compatible Object Storage)
Containerization Podman

Export to Sheets
Local Setup and Installation 🛠️
Follow these steps to get the project running locally on your machine.

Prerequisites
Python 3.x

Node.js and npm

Podman

Git

1. Clone the Repository
   Bash

git clone https://github.com/p-sashank/s3_File_Explorer.git
cd s3_File_Explorer

2. Start External Services (MinIO & MySQL)
   Start the necessary storage and database containers using Podman.

Start MinIO:

Bash

podman run \
 -p 9000:9000 \
 -p 9001:9001 \
 --name minio_s3_explorer \
 -e "MINIO_ROOT_USER=minioadmin" \
 -e "MINIO_ROOT_PASSWORD=minioadmin" \
 minio/minio server /data --console-address ":9001"
Access the MinIO console at http://localhost:9001 and create a bucket named s3-explorer-files.

Start MySQL:

Bash

podman run \
 --name mysql_s3_explorer \
 -e MYSQL_ROOT_PASSWORD=mysecretpassword \
 -e MYSQL_DATABASE=s3_explorer_db \
 -p 3306:3306 \
 -d mysql/mysql-server:8.0

3. Set Up the Backend
   Navigate to the backend directory.

Bash

cd backend
Create and activate a Python virtual environment.

Bash

python -m venv .venv
source .venv/bin/activate
Install the required Python packages.

Bash

pip install -r requirements.txt
Apply database migrations.

Bash

python manage.py makemigrations
python manage.py migrate
Create an admin user.

Bash

python manage.py createsuperuser
Start the Django development server.

Bash

# Choose a port that is free, e.g., 8090

python manage.py runserver 8090

4. Set Up the Frontend
   In a new terminal window, navigate to the frontend directory.

Bash

cd frontend
Install the required Node.js packages.

Bash

npm install
Important: Make sure the API_BASE_URL in src/App.js matches the port your Django server is running on (e.g., http://localhost:8090).

Start the React development server.

Bash

npm start

5. Access the Application
   Frontend Application: http://localhost:3000

Backend API: http://localhost:8090

Django Admin: http://localhost:8090/admin/

MinIO Console: http://localhost:9001

Future Improvements ✨
File Versioning: Instead of overwriting files on modification, create new versions.

XLS File Preview: Display a preview of the spreadsheet data directly in the browser.

Advanced XLS Operations: Implement more complex data transformations, filtering, and aggregation.

Search and Filter: Add functionality to search and filter the file list.

Container Orchestration: Use podman-compose to manage all services with a single command.

Testing: Implement unit and integration tests for the backend and frontend.
