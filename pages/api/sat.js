import axios from 'axios'

export default async function handler(req, res) {
	const response = await axios.get(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
      {
        responseType: "text", // important for raw TLE
        timeout: 10000
      }
    );

    console.log("CELESTRAK DATA ", response.data)

    res.status(200).json({
		data: response.data,
		message: "CELESTRAK DATA"
	})

}