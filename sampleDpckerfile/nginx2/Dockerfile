FROM nginx:alpine

#HTMLを配信
COPY ./html/index.html /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

