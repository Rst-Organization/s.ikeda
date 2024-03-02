FROM nginx:alpine

#HTMLを配信
COPY ./html/index.html /usr/share/nginx/html

EXPOSE 80
#nginxの起動
CMD ["nginx", "-g", "daemon off;"]

