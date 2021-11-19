# 脚本用于commit之前检查大图片，如果新增单张图片超过50k,则commit失败
# 下面代码表示 排除mp4格式文件(忽略大小写)
file_max_size=500
git status | grep -i -E -v "[.]mp4$" | grep "new file" | while read line;
do
    # 截取文件名
    file_name=`echo $line | awk '{print $3 }' `
    file_size=`stat -f %z $file_name`
    # 把图片大小转换成kb,保留2位小数点
    sizekb=`echo "$file_size 1024" | awk '{printf "%i", $1 / $2}'`
    if [ $sizekb -gt  $file_max_size ]
    then
        echo "提交的文件大于 $file_max_size KB ,如果是图片请压缩,如果无法压缩了请找UI重新出图,如果是文件请拆分"
        echo " ------------------------ 错误的文件 ------------------------ "
        echo "$file_name is $sizekb KB"
        echo " ------------------------ 错误的文件 end ------------------------ "
        exit 1
    fi
done
