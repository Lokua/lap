echo "KNOWLEDGE IS POWER"

# from lap dir, build and push to git
grunt push

# store pwd
pushd . > /dev/null

# delete and reinstall lap components
cd ../lap-controls && grunt update

# return to last pushd pwd (lap)
popd > /dev/null

exit