FROM public.ecr.aws/lambda/python:3.10

COPY . ./

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD ["lambda_function.handler"]
