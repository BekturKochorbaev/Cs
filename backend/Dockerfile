# pull python base image
FROM python:3.10

# set working directory
WORKDIR /app/

# copy the requirements.txt file
COPY requirements.txt .

# install the dependencies
RUN pip install -r requirements.txt

# copy the application files
COPY . .

# make entrypoint.sh executable
RUN chmod +x entrypoint.sh

# run entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

