cd $1
for f in *.$2; do
	mv -- "$f" "${f%.$2}.$3"
done
