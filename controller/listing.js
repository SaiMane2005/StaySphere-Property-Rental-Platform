const Listing = require("../models/listing.js")
const mbxGeoCoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeoCoding({ accessToken: mapToken });
module.exports.index=async (req, res) => {
  const allListings = await Listing.find({});
  res.render("./listings/index.ejs", { allListings });
}
module.exports.renderNewForm=(req, res) => {
  console.log(req.user);
  res.render("./listings/new.ejs");

}
module.exports.showListing=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate({path:"review",
    populate:{
      path:'author',
    }
  }).populate("owner");
  if(!listing){
    req.flash("error","Listing you are requested does not exist");
    return res.redirect("/listings")
  }
  if (!Array.isArray(listing.geometry?.coordinates) || listing.geometry.coordinates.length !== 2) {
    const response = await geocodingClient.forwardGeocode({
      query: `${listing.location}, ${listing.country}`,
      limit: 1
    }).send();
    const geometry = response.body.features[0]?.geometry;
    if (geometry) {
      listing.geometry = geometry;
    }
  }
  // console.log(listing)
  res.render("./listings/show.ejs", { listing });
}

module.exports.createListing=async (req, res, next) => {

  let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send()



    let url=req.file.path;
    let filename=req.file.filename;
    const newListing = new Listing(req.body.listing);//
    newListing.owner=req.user._id;//to save current user which is loged into the database
    newListing.image={url,filename}
    newListing.geometry=response.body.features[0].geometry;
    let saveedlisting=await newListing.save();
    console.log(saveedlisting);
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
}

module.exports.renderEditForm=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error","Listing you are requested does not exist");
    res.redirect("/listings")
  }
  let originalImageUrl=listing.image.url;
  originalImageUrl.replace("/upload","/upload/w_250")//changed the pixel resolution
  res.render("./listings/edit.ejs", { listing, originalImageUrl});
}
module.exports.updateListing=async (req, res) => {
    const { id } = req.params;
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if( typeof req.file!=="undefined"){
      let url=req.file.path;
      let filename=req.file.filename;
      listing.image={url,filename}
      await listing.save()

    }

    req.flash("success","Listing upadated");
    res.redirect(`/listings/${id}`);
}
module.exports.distroyListing=async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success","Listing Deleted");
  res.redirect("/listings");
}
